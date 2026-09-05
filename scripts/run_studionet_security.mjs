import {refundWithProof} from './settlement-proof.mjs';
import {createClient} from '../frontend/node_modules/genlayer-js/dist/index.js';
import {studionet} from '../frontend/node_modules/genlayer-js/dist/chains/index.js';
import {TransactionStatus} from '../frontend/node_modules/genlayer-js/dist/types/index.js';
import {generatePrivateKey,privateKeyToAccount} from '../frontend/node_modules/viem/_esm/accounts/index.js';

const contract=process.env.CONTRACT_ADDRESS;
const reporterKey=process.env.TEST_PRIVATE_KEY;
if(!/^0x[0-9a-fA-F]{40}$/.test(contract||''))throw new Error('Set CONTRACT_ADDRESS');
if(!/^(0x)?[0-9a-fA-F]{64}$/.test(reporterKey||''))throw new Error('Set TEST_PRIVATE_KEY');
const reporter=privateKeyToAccount(reporterKey.startsWith('0x')?reporterKey:`0x${reporterKey}`);
const attacker=privateKeyToAccount(generatePrivateKey());
const reader=createClient({chain:studionet});
const client=account=>createClient({chain:studionet,account});
const parse=async(functionName,args=[])=>JSON.parse(await reader.readContract({address:contract,functionName,args}));
const BOND=10n**15n;
const txs=[];
async function write(account,functionName,args=[],value=0n){
 const hash=await client(account).writeContract({address:contract,functionName,args,...(value?{value}:{})});console.log(`${functionName}=${hash}`);
 for(let attempt=1;attempt<=20;attempt++){try{await reader.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED});break}catch(error){if(attempt===20)throw error;await new Promise(r=>setTimeout(r,5000))}}
 txs.push({actor:account.address,functionName,hash});return hash;
}

const version=await reader.readContract({address:contract,functionName:'get_protocol_version',args:[]});
if(version!=='PRS-1.2.0-settlement')throw new Error(`Wrong deployed revision: ${version}`);
const before=await parse('get_counts');const watchId=BigInt(before.watch_count),submissionId=BigInt(before.submission_count);
console.log(`reporter=${reporter.address}`);console.log(`ephemeral_attacker=${attacker.address}`);
await write(reporter,'register_watch',[reporter.address,'FOOD','Unrelated Security Fixture','Security regression fixture','SEC-LOT-1']);
await write(reporter,'submit_notice',[watchId,'FDA_FOOD','F-1170-2024'],BOND);
await write(reporter,'assess_notice',[submissionId]);
let submission=await parse('get_submission',[submissionId]);
if(submission.state!==3||submission.bond_wei!==BOND.toString())throw new Error(`Terminal fixture failed: ${JSON.stringify(submission)}`);
const attackHash=await write(attacker,'return_bond',[submissionId,1n]);
const attackTx=await reader.getTransaction({hash:attackHash});if((attackTx.triggered_transactions||[]).length)throw new Error('Wrong actor emitted a transfer');
const afterAttack=await parse('get_submission',[submissionId]);
if(afterAttack.bond_returned!==0||afterAttack.bond_wei!==BOND.toString())throw new Error('Wrong actor mutated the bond');
console.log(`wrong_actor_no_mutation=${JSON.stringify(afterAttack)}`);
await refundWithProof({contract,reporter:reporter.address,submissionId,write:(fn,args)=>write(reporter,fn,args),parse});submission=await parse('get_submission',[submissionId]);
if(submission.bond_returned!==1||submission.bond_wei!=='0')throw new Error('Reporter bond return failed');
const balanceBeforeReplay=await reader.getBalance({address:reporter.address});
const replayHash=await write(reporter,'return_bond',[submissionId,1n]);
const replayTx=await reader.getTransaction({hash:replayHash});
const balanceAfterReplay=await reader.getBalance({address:reporter.address});
if((replayTx.triggered_transactions||[]).length||balanceAfterReplay!==balanceBeforeReplay)throw new Error('Replay emitted or credited a second transfer');
const afterReplay=await parse('get_submission',[submissionId]);
if(JSON.stringify(afterReplay)!==JSON.stringify(submission))throw new Error('Replay mutated the returned bond');
console.log(`replay_no_mutation=${JSON.stringify(afterReplay)}`);
console.log(`accounting=${JSON.stringify(await parse('get_accounting'))}`);console.log(`transactions=${JSON.stringify(txs)}`);
