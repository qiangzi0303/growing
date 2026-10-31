import {destinations} from './course-catalog.js';

const normalize=text=>String(text||'').normalize('NFKC').toLowerCase().replace(/[\s，。、！!？?：:·…（）()－-]/g,'');
export const destinationById=id=>destinations.find(d=>d.id===id)||null;
const handoffKey='growing-duck-navigation-v1';
export function openDestination(id,{baseUrl,teach=false,navigate=href=>location.assign(href)}={}){
  const destination=destinationById(id);
  if(!destination)throw Error('这个课程位置已失效，请重新选择知识点。');
  const url=new URL(destination.href,baseUrl);
  if(url.origin!==location.origin)throw Error('只能打开当前学习站点的课程。');
  sessionStorage.setItem(handoffKey,JSON.stringify({courseId:destination.courseId,expires:Date.now()+30000,teach:teach===true}));
  try{navigate(url.href);}catch(error){sessionStorage.removeItem(handoffKey);throw error;}
}
export function consumeNavigation(courseId){
  try{
    const pending=JSON.parse(sessionStorage.getItem(handoffKey)||'null');
    if(!pending)return null;
    if(!Number.isFinite(pending.expires)||pending.expires<Date.now()){sessionStorage.removeItem(handoffKey);return null;}
    if(pending.courseId!==courseId)return null;
    sessionStorage.removeItem(handoffKey);return {teach:pending.teach===true};
  }catch{return null;}
}

// Only explicit page commands are handled here; normal teaching questions stay in the conversation.
export function navigationIntent(text,{courseId='',choices=[]}={}){
  const raw=String(text||'').trim().slice(0,220);
  const simple=normalize(raw.replace(/^(?:小鸭(?:老师)?)[，,\s]*/,''));
  if(choices.length){
    const index={'第一个':0,'第1个':0,'第一个知识点':0,'第二个':1,'第2个':1,'第三个':2,'第3个':2,'第四个':3,'第4个':3,'第五个':4,'第5个':4}[simple.replace(/^(?:选|选择|打开)/,'').replace(/[吧啊]$/,'')];
    const number=/^[1-5]$/.test(simple)?Number(simple)-1:index;
    const chosen=Number.isInteger(number)?choices[number]:choices.find(d=>[d.title,...d.aliases].some(t=>normalize(t)===simple.replace(/^(?:选|选择|打开)/,'')));
    if(chosen)return {type:'open',destination:destinationById(chosen.id)};
    if(/^(?:取消|算了|不跳了|不用了)$/.test(simple))return {type:'cancel'};
  }
  if(/^(?:请)?(?:切换到|打开|学习)?[上下]一个知识点$/.test(simple)){
    const current=destinations.find(d=>d.kind!=='unit'&&d.courseId===courseId);
    const siblings=current?destinations.filter(d=>d.kind!=='unit'&&d.unitId===current.unitId&&d.kind===current.kind):[];
    const next=siblings[siblings.indexOf(current)+(simple.includes('下一个')?1:-1)];
    return next?{type:'open',destination:next}:{type:'missing',message:'当前已到本单元的边界，请说出想学习的知识点名称。'};
  }
  if(/[?？]|为什么|怎么|如何|是什么|是不是|能不能|可不可以/.test(raw))return null;
  const command=raw.replace(/^(?:小鸭(?:老师)?)[，,\s]*/,'').replace(/^(?:请|麻烦你|麻烦|帮我)[，,\s]*/,'');
  const match=command.match(/^(?:(?:我(?:现在)?(?:想要|想|要))?(?:学习|复习|学一下|学)|(?:带我|我(?:现在)?(?:想要|想|要))?(?:打开|跳转到|跳到|切换到|切到|进入))\s*(.+?)(?:[吧啊。！!]|谢谢)*$/);
  if(!match)return null;
  let query=match[1].replace(/^(?:一下|一下子|关于)/,'').replace(/(?:的)?(?:知识点|这一课|这节课|页面)$/,'').trim();
  let subject='';
  for(const [label,key] of [['数学','math'],['物理','physics'],['英语','english']])if(query.startsWith(label)){subject=key;query=query.slice(label.length).replace(/^[的：:\s]+/,'');break;}
  const needle=normalize(query);
  if(!needle)return {type:'missing',message:'请说出想学习的课程或知识点，例如“我要学习因式分解”。'};
  const score=d=>Math.max(0,...[d.title,...d.aliases].map(t=>normalize(t)===needle?100:needle.length>=2&&normalize(t).includes(needle)?60:0));
  const matches=destinations.filter(d=>!subject||d.subject===subject).map(d=>({d,score:score(d)})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||Number(b.d.kind==='unit')-Number(a.d.kind==='unit'));
  if(!matches.length)return {type:'missing',message:'暂时没有找到“'+query+'”的可打开课程，请换用目录中的知识点名称。'};
  const best=matches.filter(r=>r.score===matches[0].score);
  const unit=best.find(r=>r.d.kind==='unit'&&normalize(r.d.title)===needle);
  if(unit)return {type:'open',destination:unit.d};
  const unique=[...new Map(best.map(r=>[r.d.courseId,r.d])).values()];
  return unique.length===1?{type:'open',destination:unique[0]}:{type:'choose',choices:unique.slice(0,5),message:'找到多个相关知识点，请选一个，或说“第一个”“第二个”。'};
}
