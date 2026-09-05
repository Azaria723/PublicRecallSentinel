// Raw receipts preserve Studionet's recipient-credit flag and child links.
// Parent FINALIZED / BOND_RETURNED alone is deliberately insufficient.
export const RPC='https://studio.genlayer.com/api';
export async function rpc(method,params=[]){
 const r=await fetch(RPC,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw new Error(`RPC HTTP ${r.status}`);
 const payload=await r.json();if(payload.error)throw new Error(JSON.stringify(payload.error));return payload.result;
}
export async function snapshotBalance(address){return BigInt(await rpc('eth_getBalance',[address,'latest']));}
export function validatePaidChild(parent,child,contract,reporter,amount){
 const eq=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
 if(parent.status!=='FINALIZED'||parent.consensus_data?.leader_receipt?.[0]?.execution_result!=='SUCCESS')throw new Error('Parent execution not successful and finalized');
 if(!eq(parent.from_address,reporter)||!eq(parent.to_address,contract))throw new Error('Wrong parent parties');
 if(parent.triggered_transactions?.length!==1||!eq(parent.triggered_transactions[0],child.hash)||!eq(child.triggered_by,parent.hash))throw new Error('Unbound child transfer');
 if(child.status!=='FINALIZED'||child.type!==0||!eq(child.from_address,contract)||!eq(child.to_address,reporter)||BigInt(child.value)!==amount)throw new Error('Wrong child status/type/recipient/value');
 if(child.value_credited!==true||child.consensus_data?.leader_receipt?.[0]?.execution_result==='ERROR')throw new Error('Recipient credit NOT confirmed');
 return {parent_hash:parent.hash,child_hash:child.hash,sender:child.from_address,recipient:child.to_address,value_wei:String(child.value),status:child.status,value_credited:child.value_credited};
}
export async function waitPaidChild(hash,contract,reporter,amount){
 for(let i=0;i<60;i++){
  const parent=await rpc('eth_getTransactionByHash',[hash]);
  const children=parent?.triggered_transactions||[];
  if(children.length===1){
   const child=await rpc('eth_getTransactionByHash',[children[0]]);
   if(child?.status==='FINALIZED')return validatePaidChild(parent,child,contract,reporter,amount);
  }
  if(i%10===0)console.log('Waiting for linked recipient transfer, not just parent finality…');
  await new Promise(r=>setTimeout(r,3000));
 }
 throw new Error('Transfer evidence unavailable. Keep PENDING; do not send another refund.');
}
export async function refundWithProof({contract,reporter,submissionId,write,parse}){
 const before=await snapshotBalance(reporter);
 const s=await parse('get_submission',[submissionId]);
 const parentHash=await write('return_bond',[submissionId,BigInt(s.refund_attempt)+1n]);
 const pending=await parse('get_submission',[submissionId]);
 if(pending.refund_state!==1||pending.bond_returned!==0||pending.bond_wei!==s.bond_wei)throw new Error('Refund incorrectly marked paid at emission');
 const proof=await waitPaidChild(parentHash,contract,reporter,BigInt(s.bond_wei));
 const after=await snapshotBalance(reporter);
 proof.balance_before_wei=String(before);proof.balance_after_wei=String(after);proof.balance_delta_wei=String(after-before);
 // Run in an otherwise idle test wallet. Fail closed if fees/other activity
 // make a simple recipient delta insufficient; investigate rather than pass.
 if(after-before!==BigInt(s.bond_wei))throw new Error(`Recipient balance delta mismatch: ${JSON.stringify(proof)}`);
 const confirmation=await write('reconcile_refund',[submissionId,parentHash]);
 const paid=await parse('get_submission',[submissionId]);
 if(paid.refund_state!==2||paid.bond_returned!==1||paid.bond_wei!=='0'||paid.refund_proof!==parentHash.toLowerCase())throw new Error('On-chain settlement reconciliation failed');
 proof.reconciliation_hash=confirmation;proof.submission_id=String(submissionId);
 console.log(`recipient_settlement_proof=${JSON.stringify(proof)}`);
 return proof;
}
