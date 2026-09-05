import {rpc} from './settlement-proof.mjs';
const hash=process.argv[2]||'0x02ddd161b9fe51073bedcf9e37d7dfb2fc80ecf5622dd967600b1b77eb2af753';
if(!/^0x[0-9a-fA-F]{64}$/.test(hash))throw new Error('Expected transaction hash');
const parent=await rpc('eth_getTransactionByHash',[hash]);
const compact=t=>({hash:t.hash,from:t.from_address,to:t.to_address,type:t.type,value:t.value,status:t.status,triggered_by:t.triggered_by,value_credited:t.value_credited,execution_result:t.consensus_data?.leader_receipt?.[0]?.execution_result||null,result_base64:t.consensus_data?.leader_receipt?.[0]?.result||null});
const children=[];for(const h of parent.triggered_transactions||[])children.push(compact(await rpc('eth_getTransactionByHash',[h])));
console.log(JSON.stringify({rpc:'https://studio.genlayer.com/api',chain_id:await rpc('eth_chainId'),observed_at:new Date().toISOString(),parent:compact(parent),children},null,2));
