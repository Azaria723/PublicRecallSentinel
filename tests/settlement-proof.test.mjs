import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePaidChild} from '../scripts/settlement-proof.mjs';
const contract='0x'+'1'.repeat(40),reporter='0x'+'2'.repeat(40),amount=10n**15n;
const parent={hash:'0x'+'a'.repeat(64),status:'FINALIZED',from_address:reporter,to_address:contract,consensus_data:{leader_receipt:[{execution_result:'SUCCESS'}]},triggered_transactions:['0x'+'b'.repeat(64)]};
const child={hash:parent.triggered_transactions[0],triggered_by:parent.hash,status:'FINALIZED',type:0,from_address:contract,to_address:reporter,value:String(amount),value_credited:true};
test('accept only linked finalized recipient credit',()=>assert.equal(validatePaidChild(parent,child,contract,reporter,amount).value_credited,true));
for(const [name,patch] of Object.entries({error:{consensus_data:{leader_receipt:[{execution_result:'ERROR'}]}},uncredited:{value_credited:false},missingCredit:{value_credited:undefined},wrongRecipient:{to_address:contract},wrongSender:{from_address:reporter},wrongAmount:{value:'1'},pending:{status:'ACCEPTED'},wrongParent:{triggered_by:child.hash},internalCall:{type:2}})){
 test(`reject ${name} despite parent FINALIZED`,()=>assert.throws(()=>validatePaidChild(parent,{...child,...patch},contract,reporter,amount)));
}
test('reject missing child linkage',()=>assert.throws(()=>validatePaidChild({...parent,triggered_transactions:[]},child,contract,reporter,amount)));
