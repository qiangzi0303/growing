// Used only by the loopback classroom preview, never by the deployed Worker.
import {readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify,parseEnv} from 'node:util';
import {fileURLToPath} from 'node:url';
import {resolveManagedModel} from '../cloudflare/src/managed-ai.ts';
import type {Database} from '../cloudflare/src/database.ts';

const cwd=fileURLToPath(new URL('../cloudflare/',import.meta.url));
let stage='local-environment';
async function config(){
 const env=parseEnv(await readFile(new URL('../cloudflare/.dev.vars',import.meta.url),'utf8'));
 // Wrangler uses the developer's existing Cloudflare authorization for this read-only query.
 stage='read-managed-config';
 const {stdout}=await promisify(execFile)(process.execPath,[
  fileURLToPath(new URL('../cloudflare/node_modules/wrangler/bin/wrangler.js',import.meta.url)),
  'd1','execute','growing-db','--remote','--json','--command',
  "SELECT * FROM GrowingAIModels WHERE Id='chat' AND Enabled=1"
 ],{cwd,timeout:30000,maxBuffer:1024*1024,windowsHide:true});
 stage='parse-managed-config';
 const result=JSON.parse(stdout);
 if(!Array.isArray(result)||!result[0]?.success||!Array.isArray(result[0].results))throw Error('Invalid configuration response');
 const rows=result[0].results;
 const db={query:async()=>rows,batch:async()=>{throw Error('Read only');},close:async()=>{}} as Database;
 stage='decrypt-managed-config';
 const model=await resolveManagedModel(db,env,'chat');
 if(!model)throw Error('Chat model unavailable');
 return {models:[model]};
}
try{
 const data=await config();
 // The server captures this private pipe in memory; metadata mode is safe for terminal checks.
 process.stdout.write(JSON.stringify(process.argv.includes('--metadata')?{configured:true,model:data.models[0].model,revision:data.models[0].revision}:data));
}catch(error){
 const e=error as {name?:string;code?:string;signal?:string;stderr?:string;stdout?:string};
 const reason=e.signal||e.code||e.name||'Error';
 const expired=stage==='read-managed-config'&&/not logged in|token has expired|authentication error/i.test((e.stdout||'')+(e.stderr||''));
 process.stderr.write(expired?'Cloudflare 本机授权已过期，请重新运行 wrangler login 后重试。':'无法读取后台对话模型配置（'+stage+' / '+reason+'）。请检查网络及后台模型配置。');
 process.exitCode=expired?3:1;
}
