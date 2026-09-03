import json
import re
import pytest

BOND=10**15
NOTICE='F-2026-1001'
URL='https://api.fda.gov/food/enforcement.json?search=recall_number:%22F-2026-1001%22&limit=1'

def addr(v): return '0x'+v.hex() if isinstance(v,bytes) else str(v)

def setup(vm,deploy,owner,distributor):
    vm.strict_mocks=True;vm.check_pickling=True
    with vm.prank(owner): c=deploy('contracts/PublicRecallSentinel.py')
    with vm.prank(owner): assert c.register_watch(addr(distributor),'FOOD','Acme Foods','Oat Bar 50g','LOT-A7')==0
    return c

def submit(vm,c,reporter,notice=NOTICE,authority='FDA_FOOD'):
    vm.value=BOND
    with vm.prank(reporter): result=c.submit_notice(0,authority,notice)
    vm.value=0
    return result

def official(status='Ongoing',notice=NOTICE,product='Acme Foods Oat Bar 50g',code='LOT-A7'):
    return json.dumps({'results':[{'recall_number':notice,'status':status,'recalling_firm':'Acme Foods','product_description':product,'code_info':code,'distribution_pattern':'Nationwide'}]}).encode()

def mocks(vm,body,status=200,identity='MATCH',notice_state='ACTIVE'):
    vm.mock_web(re.escape(URL)+r'$',{'status':status,'body':body})
    vm.mock_llm(r'Compare this product watch.*',json.dumps({'identity':identity,'notice_state':notice_state}))

def reset_mocks(vm):
    """DirectMode keeps first-match mocks; clear them to model a later authority response."""
    vm._web_mocks.clear()
    vm._llm_mocks.clear()

def test_positive_match_and_bond_return(direct_vm,direct_deploy,direct_alice,direct_bob,direct_charlie):
    c=setup(direct_vm,direct_deploy,direct_alice,direct_bob)
    assert submit(direct_vm,c,direct_charlie)==0
    s=json.loads(c.get_submission(0));assert s['source_url']==URL and s['reporter'].lower()==addr(direct_charlie).lower()
    mocks(direct_vm,official());assert c.assess_notice(0)==2
    assert json.loads(c.get_watch(0))['verdict']=='MATCH'
    with direct_vm.prank(direct_charlie): assert c.return_bond(0)=='BOND_RETURNED'
    with direct_vm.prank(direct_charlie): assert c.return_bond(0)=='BOND_ALREADY_RETURNED'
    assert json.loads(c.get_accounting())=={'active_bonds':'0','total_bonded':str(BOND),'total_returned':str(BOND)}

def test_authority_is_derived_not_reporter_url(direct_vm,direct_deploy,direct_alice,direct_bob,direct_charlie):
    c=setup(direct_vm,direct_deploy,direct_alice,direct_bob);direct_vm.value=BOND
    for authority,notice in [('FDA_DRUG',NOTICE),('FDA_FOOD','https://evil.example/x'),('FDA_FOOD','../x')]:
        with direct_vm.prank(direct_charlie),pytest.raises(Exception,match='AUTHORITY_OR_NOTICE_INVALID'): c.submit_notice(0,authority,notice)
    direct_vm.value=0;assert json.loads(c.get_counts())['submission_count']==0

def test_exact_bond_and_atomic_failure(direct_vm,direct_deploy,direct_alice,direct_bob,direct_charlie):
    c=setup(direct_vm,direct_deploy,direct_alice,direct_bob)
    for amount in [0,BOND-1,BOND+1]:
        direct_vm.value=amount
        with direct_vm.prank(direct_charlie),pytest.raises(Exception,match='EXACT_BOND_REQUIRED'): c.submit_notice(0,'FDA_FOOD',NOTICE)
    direct_vm.value=0;assert json.loads(c.get_accounting())['total_bonded']=='0'

def test_notice_id_mismatch_rejected_before_llm(direct_vm,direct_deploy,direct_alice,direct_bob,direct_charlie):
    c=setup(direct_vm,direct_deploy,direct_alice,direct_bob);submit(direct_vm,c,direct_charlie)
    direct_vm.mock_web(re.escape(URL)+r'$',{'status':200,'body':official(notice='OTHER')})
    assert c.assess_notice(0)==3
    result=json.loads(c.get_assessment(0,1));assert result['reason']=='NOTICE_ID_MISMATCH' and result['identity']=='NO_MATCH'

@pytest.mark.parametrize('status,body',[(503,b''),(200,b'not-json'),(200,b'{"results":[]}')])
def test_authority_failure_is_uncertain_and_bond_locked(direct_vm,direct_deploy,direct_alice,direct_bob,direct_charlie,status,body):
    c=setup(direct_vm,direct_deploy,direct_alice,direct_bob);submit(direct_vm,c,direct_charlie)
    direct_vm.mock_web(re.escape(URL)+r'$',{'status':status,'body':body});assert c.assess_notice(0)==4
    with direct_vm.prank(direct_charlie): assert c.return_bond(0)=='ASSESSMENT_NOT_TERMINAL'
    assert json.loads(c.get_accounting())['active_bonds']==str(BOND)

def test_uncertain_retry_appends_history(direct_vm,direct_deploy,direct_alice,direct_bob,direct_charlie):
    c=setup(direct_vm,direct_deploy,direct_alice,direct_bob);submit(direct_vm,c,direct_charlie)
    direct_vm.mock_web(re.escape(URL)+r'$',{'status':503,'body':b''});assert c.assess_notice(0)==4
    first=c.get_assessment(0,1);reset_mocks(direct_vm);mocks(direct_vm,official());assert c.assess_notice(0)==2
    assert c.get_assessment(0,1)==first and json.loads(c.get_submission(0))['assessment_count']==2

@pytest.mark.parametrize('identity,state,code',[('NO_MATCH','ACTIVE',3),('UNRESOLVED','ACTIVE',4),('PAY','ACTIVE',4),('MATCH','MAYBE',4)])
def test_closed_semantic_surface(direct_vm,direct_deploy,direct_alice,direct_bob,direct_charlie,identity,state,code):
    c=setup(direct_vm,direct_deploy,direct_alice,direct_bob);submit(direct_vm,c,direct_charlie);mocks(direct_vm,official(),identity=identity,notice_state=state)
    assert c.assess_notice(0)==code

def test_reporter_only_bond_return(direct_vm,direct_deploy,direct_alice,direct_bob,direct_charlie):
    c=setup(direct_vm,direct_deploy,direct_alice,direct_bob);submit(direct_vm,c,direct_charlie);mocks(direct_vm,official());c.assess_notice(0)
    with direct_vm.prank(direct_alice): assert c.return_bond(0)=='REPORTER_ONLY'
    assert json.loads(c.get_submission(0))['bond_wei']==str(BOND)

def test_remediation_requires_official_termination(direct_vm,direct_deploy,direct_alice,direct_bob,direct_charlie):
    c=setup(direct_vm,direct_deploy,direct_alice,direct_bob);submit(direct_vm,c,direct_charlie);mocks(direct_vm,official());assert c.assess_notice(0)==2
    reset_mocks(direct_vm);mocks(direct_vm,official(),identity='MATCH',notice_state='ACTIVE');assert c.verify_remediation(0)=='RECALL_STILL_ACTIVE'
    assert json.loads(c.get_watch(0))['state']==2
    reset_mocks(direct_vm);mocks(direct_vm,official(status='Terminated'),identity='MATCH',notice_state='TERMINATED');assert c.verify_remediation(0)=='REMEDIATION_VERIFIED'
    w=json.loads(c.get_watch(0));assert w['state']==5 and w['verdict']=='REMEDIATED'

def test_new_notice_supersedes_old_after_no_match(direct_vm,direct_deploy,direct_alice,direct_bob,direct_charlie):
    c=setup(direct_vm,direct_deploy,direct_alice,direct_bob);submit(direct_vm,c,direct_charlie);mocks(direct_vm,official(),identity='NO_MATCH');assert c.assess_notice(0)==3
    assert submit(direct_vm,c,direct_alice)==1
    assert c.assess_notice(0)=='SUBMISSION_NOT_CURRENT' and json.loads(c.get_submission(0))['assessment_count']==1

def test_invalid_watch_identity(direct_vm,direct_deploy,direct_alice,direct_bob):
    with direct_vm.prank(direct_alice): c=direct_deploy('contracts/PublicRecallSentinel.py')
    for category,manufacturer in [('DEVICE','Acme'),('FOOD','')]:
        with direct_vm.prank(direct_alice),pytest.raises(Exception): c.register_watch(addr(direct_bob),category,manufacturer,'Product','LOT')
    assert json.loads(c.get_counts())['watch_count']==0
