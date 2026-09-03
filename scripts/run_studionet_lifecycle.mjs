import {createClient} from '../frontend/node_modules/genlayer-js/dist/index.js';
import {studionet} from '../frontend/node_modules/genlayer-js/dist/chains/index.js';
import {TransactionStatus} from '../frontend/node_modules/genlayer-js/dist/types/index.js';
import {privateKeyToAccount} from '../frontend/node_modules/viem/_esm/accounts/index.js';

const contract=process.env.CONTRACT_ADDRESS;
const key=process.env.TEST_PRIVATE_KEY;
if(!/^0x[0-9a-fA-F]{40}$/.test(contract||''))throw new Error('Set CONTRACT_ADDRESS');
if(!/^(0x)?[0-9a-fA-F]{64}$/.test(key||''))throw new Error('Set TEST_PRIVATE_KEY');
const account=privateKeyToAccount(key.startsWith('0x')?key:`0x${key}`);
const reader=createClient({chain:studionet});
const writer=createClient({chain:studionet,account});
const BOND=10n**15n;
const txs=[];
const parse=async(functionName,args=[])=>JSON.parse(await reader.readContract({address:contract,functionName,args}));
async function write(functionName,args=[],value=0n){
 const hash=await writer.writeContract({address:contract,functionName,args,...(value?{value}:{})});
 console.log(`${functionName}=${hash}`);
 let receipt;
 for(let attempt=1;attempt<=20;attempt++){
  try{receipt=await reader.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED});break}
  catch(error){if(attempt===20)throw error;console.log(`wait_${attempt}=${error.shortMessage||error.message}`);await new Promise(r=>setTimeout(r,5000))}
 }
 console.log(`${functionName}_status=${receipt.status_name||receipt.status}`);txs.push({functionName,hash});return hash;
}

console.log(`contract=${contract}`);console.log(`actor=${account.address}`);
const version=await reader.readContract({address:contract,functionName:'get_protocol_version',args:[]});
if(version!=='PRS-1.1.0-audit')throw new Error(`Wrong deployed revision: ${version}`);
console.log(`protocol_version=${version}`);
const before=await parse('get_counts');console.log(`counts_before=${JSON.stringify(before)}`);
const positiveWatch=BigInt(before.watch_count),positiveSubmission=BigInt(before.submission_count);
await write('register_watch',[account.address,'FOOD','HandNatural','H&NATURAL 2 PACK! BRAZIL SEED 60 PIECES, PURE NATURAL SEMILLA DE BRASIL FOR 60 DAYS, 5 GRAMS PER BOX, 2 BLACK BOXES.','No Lot code on label']);
await write('submit_notice',[positiveWatch,'FDA_FOOD','F-1170-2024'],BOND);
await write('assess_notice',[positiveSubmission]);
const positive=await parse('get_watch',[positiveWatch]);console.log(`positive=${JSON.stringify(positive)}`);
if(positive.state!==2||positive.verdict!=='MATCH')throw new Error(`Positive lifecycle failed: ${JSON.stringify(positive)}`);
await write('return_bond',[positiveSubmission]);
const returned=await parse('get_submission',[positiveSubmission]);
if(returned.bond_returned!==1||returned.bond_wei!=='0')throw new Error(`Bond return failed: ${JSON.stringify(returned)}`);

const negativeWatch=positiveWatch+1n,negativeSubmission=positiveSubmission+1n;
await write('register_watch',[account.address,'FOOD','Unrelated Frozen Foods Ltd','Frozen green peas, 500g bag','LOT-Z9']);
await write('submit_notice',[negativeWatch,'FDA_FOOD','F-1170-2024'],BOND);
await write('assess_notice',[negativeSubmission]);
const negative=await parse('get_watch',[negativeWatch]);console.log(`negative=${JSON.stringify(negative)}`);
if(negative.state!==3||negative.verdict!=='NO_MATCH')throw new Error(`Negative lifecycle failed: ${JSON.stringify(negative)}`);
await write('return_bond',[negativeSubmission]);
console.log(`accounting=${JSON.stringify(await parse('get_accounting'))}`);
console.log(`counts_after=${JSON.stringify(await parse('get_counts'))}`);
console.log(`transactions=${JSON.stringify(txs)}`);
