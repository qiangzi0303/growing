/* Read-only summaries. Browsing, rewards and unfinished answers never certify mastery. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingUnitSummary=factory();})(globalThis,()=>{
  'use strict';
  const wordRules=typeof module==='object'&&module.exports?require('./word-mastery-rules.js'):{passed:(w,r)=>globalThis.WordMasteryRules?.passed(w,r)};
  const labels={weak:'薄弱',shaky:'不稳',untested:'未测',pending:'待复测',passed:'已通过',unknown:'记录不可用'};
  const result=(status='untested',detail='暂无已保存的检测记录')=>({status,detail});
  const grade=a=>a&&Number.isInteger(a.score)&&a.score>=0&&a.score<=10&&Array.isArray(a.criticalErrors)&&a.criticalErrors.every(x=>typeof x==='string')&&typeof a.feedback==='string';
  function concept(r,legacy=false){
    const attempts=(Array.isArray(r?.attempts)?r.attempts:[]).filter(legacy?a=>a?.valid===true&&Number.isFinite(a.score)&&a.score>=0&&a.score<=10&&Array.isArray(a.criticalErrors):grade);
    return {attempts,passed:attempts.some(a=>a.score>=8&&!a.criticalErrors.length)};
  }
  function course(r){
    const c=concept(r),quiz=Number.isInteger(r?.bestQuiz)&&r.bestQuiz>=0&&r.bestQuiz<=3?r.bestQuiz:0;
    if(c.passed&&quiz===3)return result('passed','课程达标 · AI解释与3题应用均通过');
    if(c.passed||quiz>0)return result('shaky',`尚需巩固 · ${c.passed?'AI解释通过':'AI解释未通过'}，应用${quiz}/3`);
    if(c.attempts.length)return result('weak','AI解释尚未达标，需回看讲解');
    return result();
  }
  function withHandwriting(summary,evidence=[]){
    const rows=summary.rows.map(row=>{
      const k=evidence.find(k=>k.nodeId===row.id);if(!k||k.score===null)return row;
      const detail='实卷手写评测 · '+k.score+'/100 · '+k.feedback;
      return k.score<80?{...row,...result(k.score<60?'weak':'shaky',detail)}:{...row,detail:row.detail+'；'+detail+'（仅本题通过）'};
    });
    return {...summary,rows};
  }
  function math({subject,chapter,data,read,diagnosis,handwriting=[]}){
    const warnings=[],get=key=>{try{return read(key);}catch{warnings.push('部分记录无法读取，原记录未改动。');return undefined;}};
    const fraction=chapter.id==='math-8b-10',raw=get(fraction?'fraction-minute-v1':subject==='physics'?'growing-physics-lessons-v1':'growing-math-lessons-v1');
    const valid=raw===null||raw&&raw.topics&&typeof raw.topics==='object'&&!Array.isArray(raw.topics)&&(fraction||raw.version===1);
    const rows=chapter.nodes.map(n=>{
      let evidence=valid?course(raw?.topics?.[n.id]):result('unknown','课程记录暂时无法读取');
      if(fraction&&valid){
        const legacyId=({meaning:'domain',extraneous:'extra'})[n.id]||n.id;
        const r=raw?.topics?.[legacyId],c=concept(r,true),exams=(Array.isArray(r?.exams)?r.exams:[]).filter(e=>e&&!e.real&&Number.isInteger(e.total)&&e.total>0&&Number.isInteger(e.correct)&&e.correct>=0&&e.correct<=e.total);
        const conceptPassed=c.passed||raw?.learning?.version===1&&Object.hasOwn(raw.learning.mastery||{},legacyId);
        evidence=conceptPassed&&exams.some(e=>e.correct===e.total)?result('passed','课程达标 · 概念与应用验证通过'):conceptPassed||exams.some(e=>e.correct>0)?result('shaky','概念解释或应用验证仍需补齐'):c.attempts.length||exams.length?result('weak','概念解释或应用验证尚未通过'):result();
      }
      return {id:n.id,title:n.title,section:n.section,...evidence};
    });
    if(!valid)warnings.push('课程记录格式无法识别，未将其当作未测或已通过。');
    const g=diagnosis.graph(data),states={};
    const archived=get('growing-diagnosis-v1:'+chapter.id);
    if(archived!==null){
      if(archived?.version===1&&archived.records&&typeof archived.records==='object'){
        const cache=new Map();
        for(const n of chapter.nodes){const s=archived.records[n.id];if(!s)continue;try{if(!cache.has(s))cache.set(s,diagnosis.assessmentCredit(g,s));if(cache.get(s)?.[n.id]!==undefined)states[n.id]={state:diagnosis.inspect(g,s).states[n.id],historical:true};}catch{warnings.push('有历史诊断记录无法核验。');}}
      }else warnings.push('历史诊断记录暂不可用。');
    }
    const saved=get((subject==='physics'?'growing-diagnosis-physics-v1:':'growing-diagnosis-year8-v1:')+chapter.id);
    if(saved){try{const s=diagnosis.inspect(g,saved);for(const [id,state] of Object.entries(s.states))states[id]={state,historical:false};if(s.canContinue)warnings.push('最近一轮诊断尚未完成；仅展示已作答证据，单题结果列为待复测。');}catch{warnings.push('最近一轮诊断记录暂不可用，未据此判定掌握。');}}
    for(const row of rows){const s=states[row.id];if(!s)continue;const mapped={weak:'weak',shaky:'shaky',pending:'pending',screened:'passed'}[s.state];if(mapped)Object.assign(row,result(mapped,(s.historical?'历史诊断 · ':'最近诊断 · ')+({weak:'两题均未通过',shaky:'两题通过一题',pending:'证据未齐，请完成复测',screened:'初筛通过，不等于课程达标'}[s.state])));}
    return withHandwriting({rows,warnings:[...new Set(warnings)]},handwriting);
  }
  function english({words,lessons,raw,engine}){
    let state;try{state=engine.restore(raw);}catch{return {rows:[...words.filter(w=>!w.optional).map(w=>({id:'word:'+w.id,title:w.word,section:'词汇 · '+w.meaning})),...lessons.map(l=>({id:'lesson:'+l.id,title:l.title,section:'阅读与语法'}))].map(n=>({...n,...result('unknown','学习记录无法读取')})),warnings:['学习记录格式无法识别，原记录未改动。']};}
    const rows=words.filter(w=>!w.optional).map(w=>{const r=state.words[w.id];return {id:'word:'+w.id,title:w.word,section:'词汇 · '+w.meaning,...(engine.wordPassed(w,r)?result('passed',r.protocol==='word-mastery-v2'?'词汇达标 · 七次默写、适用的复数与词义词类AI验证通过':'历史词汇达标 · 7次闭卷默写正确'):r?.practice?result('pending','默写或词义词类验证尚未完成'):result())};});
    for(const l of lessons){const c=concept(state.feynman[l.id]);rows.push({id:'lesson:'+l.id,title:l.title,section:'阅读与语法',...(engine.lessonPassed(l,state.lessons[l.id])?result('passed','检测达标 · 3/3正确'):c.passed?result('shaky','概念复述通过，尚需完成应用检测'):c.attempts.length?result('weak','概念复述尚未达标'):result())});}
    return {rows,warnings:[],note:'词汇按七次默写、适用的复数与词义词类AI验证汇总；历史七次默写记录保留。阅读语法按3/3检测汇总，标星选学词不计入。'};
  }
  function legacyEnglish({data,raw,engine}){
    if(raw!==null&&(!raw||typeof raw!=='object'||Array.isArray(raw)))throw Error('Unit 3记录格式无法识别');
    raw=raw||{};
    const match=(word,answer)=>{const norm=x=>String(x??'').normalize('NFKC').trim().replace(/[‘’]/g,"'").replace(/\s*\.\s*\.\s*\.\s*/g,' ... ').replace(/\s+/g,' ');return word.id==='w34'?norm(word.en)===norm(answer):norm(word.en).toLowerCase()===norm(answer).toLowerCase();};
    const rows=data.words.map(w=>{
      const r=raw.mastered?.[w.id],run=raw.wordRuns?.[w.id],answers=Array.isArray(run?.answers)?run.answers:[];
      const passed=wordRules.passed(w,r)||r?.protocol==='seven-recalls'&&Array.isArray(r.answers)&&r.answers.length===7&&r.answers.every(a=>typeof a==='string'&&match(w,a));
      const complete=run?.phase==='result'&&answers.length===7,correct=answers.filter(a=>typeof a==='string'&&match(w,a)).length;
      return {id:'word:'+w.id,title:w.en,section:'词汇 · '+w.cn,...(passed?result('passed',r.protocol==='word-mastery-v2'?'词汇达标 · 默写、复数与词义词类验证通过':'历史词汇达标 · 7次闭卷默写正确'):run?.phase==='verify'?result('pending','七次默写已完成，复数或词义词类验证待完成'):complete?result(correct?'shaky':'weak',`最近默写${correct}/7，需重新巩固`):answers.length?result('pending','默写轮次尚未完成'):result())};
    });
    for(const l of data.lessons){
      const records=(Array.isArray(raw.records)?raw.records:[]).filter(r=>r.mode==='lesson'&&r.id===l.id&&Number.isFinite(r.score)&&Number.isFinite(r.total)&&r.total>0&&r.score>=0&&r.score<=r.total),last=records.at(-1),best=raw.best?.[l.id];
      rows.push({id:'lesson:'+l.id,title:l.title,section:'知识关卡',...(last?result(last.score/last.total>=.8?'passed':last.score?'shaky':'weak',`最近考核${last.score}/${last.total}，达标线80%`):typeof best==='number'&&best>=0&&best<=100?result(best>=80?'passed':best?'shaky':'weak',`已保存最好成绩${best}%，达标线80%`):result())});
    }
    return {rows,warnings:[],note:'Unit 3词汇需七次默写、适用的复数与词义词类AI验证通过，历史默写达标记录保留；知识关卡考核达到80%。只看过词卡不计通过。'};
  }
  return {labels,math,english,legacyEnglish,withHandwriting};
});
