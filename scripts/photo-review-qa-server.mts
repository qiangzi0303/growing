/* Isolated QA only: ephemeral D1, synthetic vision responses, loopback listener. */
import {createServer} from 'node:http';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve,extname} from 'node:path';
import {createHandler} from '../cloudflare/src/index';
import {connect} from '../cloudflare/src/database';
const require=createRequire(new URL('../cloudflare/package.json',import.meta.url));
const {Miniflare,convertV4MiniflareOptions}=require('miniflare');
const repo=resolve(import.meta.dirname,'..'),out=resolve(repo,'../.nmai/tmp/photo-review');await mkdir(out,{recursive:true});
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-22',d1Databases:['DB']}));
const db=connect(await mf.getD1Database('DB'));
for(const file of (await readdir(resolve(repo,'cloudflare/migrations'))).filter(f=>f.endsWith('.sql')).sort()){
  const sql=await readFile(resolve(repo,'cloudflare/migrations',file),'utf8');await db.batch(sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql})));
}
let mode='ok',liveRequest=0;
async function liveModels(){
  const vars=await readFile(resolve(repo,'cloudflare/.dev.vars'),'utf8');
  const line=vars.split(/\r?\n/).find(s=>s.startsWith('HANDWRITING_VISION_MODELS='));
  if(!line)throw Error('Local vision configuration missing');
  let value=line.slice(line.indexOf('=')+1).trim();
  if(value.startsWith("'"))value=value.slice(1,-1);else if(value.startsWith('"'))value=JSON.parse(value);
  if(!Array.isArray(JSON.parse(value)))throw Error('Invalid local vision configuration');return value;
}
const grade=(overrides:any={})=>({verdict:'partial',score:50,studentAnswer:String.raw`第2步：\(\frac{1}{x}-\frac{1}{x+1}=\frac{(x+1)+x}{x(x+1)}\)`,feedback:'通分时括号前的减号丢失，请先保留括号再合并。',corrections:[{location:'第1页第1题第2步',issue:'把减法变成了加法',correction:String.raw`正确的分子为\((x+1)-x=1\)。`}],knowledge:[{nodeId:'add',role:'tested',confidence:.98,reason:'本题考查异分母分式加减。'},{nodeId:'add',role:'gap',confidence:.98,reason:'通分后没有保留减号。'}],models:[],...overrides});
const env:any={AUTH_LIMITER:{limit:async()=>({success:true})},AI_LIMITER:{limit:async()=>({success:true})},HANDWRITING_VISION_MODELS:JSON.stringify([{name:'qa',model:'qa',endpoint:'https://vision.test/v1',apiKey:'test-only'}]),ASSETS:{fetch:asset}};
async function asset(request:Request){
  const path=new URL(request.url).pathname,relative=path==='/'?'index.html':path.slice(1),native=relative.startsWith('assets/'),learn=relative.startsWith('learn/');
  const base=native?resolve(repo,'app/src/main/assets'):learn?resolve(repo,'app/src/main/assets/web'):resolve(repo,'platform-web');
  const file=resolve(base,native?relative.slice(7):learn?relative.slice(6):relative);
  if(!file.startsWith(base+'/')&&!file.startsWith(base+'\\'))return new Response('Not found',{status:404});
  try{const data=await readFile(file);const mime:any={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};return new Response(data,{headers:{'Content-Type':mime[extname(file)]||'application/octet-stream'}});}catch{return new Response('Not found',{status:404});}
}
const handler=createHandler(()=>db,(async(_url:any,options:any)=>{
  if(mode==='real'){const response=await fetch(_url,options);await writeFile(resolve(out,'live-upstream-'+(++liveRequest)+'.json'),await response.clone().text());return response;}
  if(mode==='failure')return new Response('QA injected failure',{status:503});
  const body=JSON.parse(options.body),system=body.messages[0].content;
  let value:any;
  if(system.includes('当前任务仅解释'))value={reply:'只提示下一步：先写出两个分式的公分母，并保留第二个分子的减号；暂时不要展开。'};
  else if(system.includes('当前仅批改本题新提交'))value=grade({verdict:'correct',score:100,corrections:[],knowledge:[{nodeId:'add',role:'tested',confidence:.98,reason:'本次订正正确保留了减号。'}]});
  else value={format:'math-text-v1',title:'整页作业批改验证',warnings:['第4题图示模糊，需要补拍'],questions:[
    {number:'1',text:String.raw`计算\(\frac{1}{x}-\frac{1}{x+1}\)。`,answer:'',unitId:'math-8b-10',confidence:.98,reason:'分式加减',uncertain:[],pages:[1],regions:[{page:1,x:.05,y:.12,width:.9,height:.2}],assessment:grade()},
    {number:'2',text:String.raw`OP平分\(\angle AOB\)，PD垂直OA，PE垂直OB，证明\(PD=PE\)。`,answer:'',unitId:'math-8a-01',confidence:.98,reason:'角平分线的性质',uncertain:[],pages:[1],regions:[{page:1,x:.05,y:.35,width:.9,height:.3}],assessment:grade({verdict:'correct',score:100,feedback:'本题全等证明正确，注意标明对应垂足。',studentAnswer:'在两个直角三角形中，斜边OP公共，锐角相等，因此AAS全等，PD=PE。',corrections:[],knowledge:[{nodeId:'angle-bisector',role:'tested',confidence:.98,reason:'角平分线上的点到角两边距离相等。'}],models:[{modelId:10,confidence:.96,reason:'角平分线、公共斜边和到角两边的垂线与模型条件吻合；仍需核对垂足在边上。'}]})},
    {number:'3',text:'分式有意义的条件是什么？',answer:'',unitId:'math-8b-10',confidence:.98,reason:'分式意义',uncertain:[],pages:[1],regions:[],assessment:grade({verdict:'unanswered',score:null,studentAnswer:'',feedback:'本题未见作答，不计对错。',corrections:[],knowledge:[]})},
    {number:'4',text:'图形条件【不清楚】。',answer:'',unitId:'',confidence:.2,reason:'图形不清',uncertain:['第4题缺少图示条件'],pages:[1],regions:[],assessment:grade({verdict:'review',score:null,studentAnswer:'【不清楚】',feedback:'请补拍第4题图形与作答。',corrections:[],knowledge:[]})}
  ]};
  return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]});
}) as typeof fetch);
const server=createServer(async(req,res)=>{
  try{
    const origin='http://127.0.0.1:'+(server.address() as any).port;
    if(req.url?.startsWith('/__qa__/mode/')){const selected=req.url.split('/').at(-1)!;if(selected==='real')env.HANDWRITING_VISION_MODELS=await liveModels();mode=selected;res.end('ok');return;}
    const buffers=[];for await(const b of req){buffers.push(b);if(buffers.reduce((n,x)=>n+x.length,0)>2200000)throw Error('body too large');}
    const body=Buffer.concat(buffers),request=new Request(origin+req.url,{method:req.method,headers:req.headers as any,...(body.length?{body}:{})});
    const response=req.url?.startsWith('/assets/')?await asset(request):await handler(request,env,{waitUntil:()=>{}});
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch(e){res.statusCode=500;res.end('Local QA server error');console.error(e instanceof Error?e.name:'Error');}
});
server.listen(0,'127.0.0.1',async()=>{const url='http://127.0.0.1:'+(server.address() as any).port;await writeFile(resolve(out,'server.json'),JSON.stringify({url}));console.log('Photo review QA ready: '+url);});
process.on('SIGTERM',async()=>{server.close();await mf.dispose();process.exit(0);});
