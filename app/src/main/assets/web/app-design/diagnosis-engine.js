/* Deterministic, independent diagnostic pilot. No DOM, network or course storage. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingDiagnosis=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  function graph(data){
    const byId=new Map(), bank=new Map(), pre=new Map(), next=new Map(), qids=new Set(), pairs=new Set();
    for(const n of data.nodes){
      if(!n.id||!n.title||!n.criterion||byId.has(n.id))throw Error('知识点缺少信息或ID重复');
      byId.set(n.id,n);bank.set(n.id,[]);pre.set(n.id,[]);next.set(n.id,[]);
    }
    for(const e of data.edges){
      const key=e.from+'>'+e.to;
      if(!byId.has(e.from)||!byId.has(e.to)||e.from===e.to||pairs.has(key)||!['hard','soft'].includes(e.strength)||!e.reason)throw Error('先修关系无效');
      pairs.add(key);pre.get(e.to).push(e);next.get(e.from).push(e);
    }
    const order=[], visiting=new Set(), done=new Set();
    function visit(id){
      if(visiting.has(id))throw Error('先修图存在环');
      if(done.has(id))return;
      visiting.add(id);pre.get(id).forEach(e=>visit(e.from));visiting.delete(id);done.add(id);order.push(id);
    }
    byId.forEach((_,id)=>visit(id));
    for(const q of data.questions){
      if(qids.has(q.id)||!bank.has(q.topic)||!['standard','basic'].includes(q.difficulty)||!q.prompt||!q.explanation||!Array.isArray(q.options)||q.options.length!==4||new Set(q.options).size!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3)throw Error('诊断题无效');
      qids.add(q.id);bank.get(q.topic).push(q);
    }
    bank.forEach(list=>{
      list.sort((a,b)=>Number(a.difficulty==='basic')-Number(b.difficulty==='basic'));
      if(list.length!==2||list[0].difficulty!=='standard'||list[1].difficulty!=='basic')throw Error('每点需要一题标准题和一题基础复测题');
    });
    return {data,byId,bank,pre,next,order};
  }
  function create(g,targets,limit=16){
    if(!Array.isArray(targets)||!targets.length||new Set(targets).size!==targets.length||targets.some(id=>!g.byId.has(id)))throw Error('诊断目标无效');
    if(!Number.isInteger(limit)||limit<1||limit>32)throw Error('题量上限无效');
    return {version:g.data.version,targets:targets.slice(),limit,answers:[],closed:false};
  }
  function createAssessment(g,targets){
    return {...create(g,targets,targets.length*2),protocol:'complete-assessment-v1'};
  }
  function inspect(g,s){
    if(!s||s.version!==g.data.version)throw Error('诊断版本不匹配');
    create(g,s.targets,s.limit);
    if(!Array.isArray(s.answers)||s.answers.length>s.limit||typeof s.closed!=='boolean')throw Error('作答记录格式错误');
    if(s.protocol!==undefined&&s.protocol!=='complete-assessment-v1')throw Error('诊断协议不匹配');
    const assessment=s.protocol==='complete-assessment-v1';
    if(assessment&&s.limit!==s.targets.length*2)throw Error('评测题量不匹配');
    const queue=s.targets.slice(), states={}, attempts={}, asked=[], reasons={};
    s.targets.forEach(id=>{reasons[id]=null;});
    function item(){
      if(assessment){
        if(asked.length>=s.limit)return null;
        const id=s.targets[asked.length%s.targets.length],round=Math.floor(asked.length/s.targets.length);
        return {topic:id,question:g.bank.get(id)[round],attempt:round+1,parent:null};
      }
      while(queue.length&&states[queue[0]]&&states[queue[0]]!=='pending')queue.shift();
      if(asked.length>=s.limit||!queue.length)return null;
      const id=queue[0],count=(attempts[id]||[]).length;
      return {topic:id,question:g.bank.get(id)[count],attempt:count+1,parent:reasons[id]};
    }
    for(const a of s.answers){
      const current=item();
      if(!current||!a||a.qid!==current.question.id||(a.choice!==null&&(!Number.isInteger(a.choice)||a.choice<0||a.choice>3)))throw Error('作答记录与出题路径不匹配');
      const id=current.topic, correct=a.choice===current.question.answer;
      const evidence={...a,topic:id,correct};asked.push(evidence);
      (attempts[id]||(attempts[id]=[])).push(evidence);
      if(assessment){
        const records=attempts[id],count=records.filter(a=>a.correct).length;
        states[id]=records.length<2?'pending':count===2?'screened':count===1?'shaky':'weak';
      }
      else if(correct){states[id]=current.attempt===1?'screened':'shaky';queue.shift();}
      else if(current.attempt===1)states[id]='pending';
      else{
        states[id]='weak';queue.shift();
        const hard=g.pre.get(id).filter(e=>e.strength==='hard'&&!states[e.from]).map(e=>e.from);
        for(const from of hard)if(!(from in reasons)||reasons[from]===null)reasons[from]=id;
        const rest=queue.filter(x=>!hard.includes(x));queue.splice(0,queue.length,...hard,...rest);
      }
    }
    const pending=item();
    const scope=new Set(s.targets);
    function expand(id){g.pre.get(id).forEach(e=>{if(!scope.has(e.from)){scope.add(e.from);expand(e.from);}});}
    s.targets.forEach(expand);
    const order=g.order.filter(id=>scope.has(id));
    const status=id=>states[id]||'untested';
    const weak=order.filter(id=>status(id)==='weak');
    const roots=weak.filter(id=>!g.pre.get(id).some(e=>e.strength==='hard'&&status(e.from)==='weak'))
      .map(id=>({id,uncertain:g.pre.get(id).filter(e=>e.strength==='hard'&&status(e.from)!=='screened').map(e=>e.from)}));
    const path=order.filter(id=>['weak','shaky'].includes(status(id)));
    const soft=[...new Set(weak.flatMap(id=>g.pre.get(id).filter(e=>e.strength==='soft'&&status(e.from)==='untested').map(e=>e.from)))];
    return {next:s.closed?null:pending,canContinue:!!pending,finished:s.closed||!pending,states,attempts,asked,order,roots,path,soft,
      limitReached:!assessment&&asked.length>=s.limit&&queue.length>0,remainingTargets:s.targets.filter(id=>['pending','untested'].includes(status(id)))};
  }
  function answer(g,s,qid,choice){
    const state=inspect(g,s);
    if(!state.next||state.next.question.id!==qid)throw Error('题目已变化，请重新读取');
    const updated={...s,answers:[...s.answers,{qid,choice}]};inspect(g,updated);return updated;
  }
  function undo(g,s){const result={...s,closed:false,answers:s.answers.slice(0,-1)};inspect(g,result);return result;}
  function restore(g,text){const value=JSON.parse(text);inspect(g,value);return value;}
  function assessmentCredit(g,s){
    if(!s||s.protocol!=='complete-assessment-v1'||s.closed!==false)return null;
    const result=inspect(g,s);
    if(result.canContinue||s.answers.length!==s.targets.length*2)return null;
    return Object.fromEntries(s.targets.map(id=>[id,result.attempts[id].filter(a=>a.correct).length/2]));
  }
  return {graph,create,createAssessment,inspect,answer,undo,restore,assessmentCredit};
});
