const expected='0xC04400A0B02e495731AD0a5fbc1A1f777Fe9017c';
for(const base of process.argv.slice(2)){
 const home=await fetch(base+'/',{signal:AbortSignal.timeout(20000)});
 const html=await home.text();
 const asset=html.match(/src="([^"]+index-[^"]+\.js)"/)?.[1];
 if(!asset)throw new Error(`Bundle missing at ${base}`);
 const js=await (await fetch(new URL(asset,base),{signal:AbortSignal.timeout(20000)})).text();
 const route=await fetch(base+'/audit-proof',{signal:AbortSignal.timeout(20000)});
 const result={base,home:home.status,route:route.status,content_type:route.headers.get('content-type'),bundle:asset,new_contract:js.toLowerCase().includes(expected.toLowerCase()),old_contract:js.toLowerCase().includes('0cd1908393c24b0426bc7ac75901afdb14d9d3de'),protocol:js.includes('PRS-1.2.0-settlement')};
 console.log(JSON.stringify(result));
 if(result.home!==200||result.route!==200||!result.new_contract||result.old_contract||!result.protocol)process.exitCode=1;
}
