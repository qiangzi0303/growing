(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.GrowingWordPilotCore=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var DAY=86400000, KINDS=['meaning','cloze','listen','spell'];
  function empty(){return {version:1,cards:{},session:null};}
  function copy(value){return JSON.parse(JSON.stringify(value));}
  function own(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
  function record(o){return !!o&&typeof o==='object'&&!Array.isArray(o)&&(Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);}
  function integer(n,min,max){return Number.isSafeInteger(n)&&n>=min&&n<=max;}
  function date(n){return integer(n,1,8640000000000000-DAY*7);}
  function check(ok){if(!ok)throw new Error('单词试学存档无效，请保留原记录后联系管理员恢复。');}
  function fields(o,allowed){check(record(o)&&Object.keys(o).every(function(k){return allowed.includes(k);}));}
  function wordMap(words){
    check(Array.isArray(words)&&words.length>0&&words.length<=100);
    var map=Object.create(null);
    words.forEach(function(w){check(record(w)&&typeof w.id==='string'&&/^[a-z][a-z0-9-]*$/.test(w.id)&&!['constructor','prototype','__proto__'].includes(w.id)&&!own(map,w.id)&&typeof w.word==='string'&&w.word.length>0);map[w.id]=w;});
    return map;
  }
  function normalized(s){return s.trim().toLowerCase();}
  function restore(raw,words){
    var map=wordMap(words);
    check(record(raw)&&raw.version===1&&record(raw.cards));
    fields(raw,['version','cards','session']);
    Object.keys(raw.cards).forEach(function(id){var c=raw.cards[id];check(own(map,id)&&record(c)&&date(c.due)&&date(c.lastAt)&&c.due>c.lastAt&&integer(c.reviews,1,1000000)&&integer(c.streak,0,c.reviews));fields(c,['due','streak','reviews','lastAt']);check(c.due-c.lastAt===DAY*[1,3,7][Math.min(Math.max(c.streak-1,0),2)]);});
    var s=raw.session;
    check(s===null||record(s));
    if(s!==null){
      fields(s,['id','mode','steps','index','answers','feedback','draft','hinted','finishedAt']);
      check(typeof s.id==='string'&&s.id.length>0&&s.id.length<=100&&['learn','practice'].includes(s.mode));
      check(Array.isArray(s.steps)&&s.steps.length>0&&s.steps.length<=words.length*4&&integer(s.index,0,s.steps.length-1));
      check(record(s.answers)&&typeof s.draft==='string'&&s.draft.length<=300&&typeof s.hinted==='boolean');
      check(s.finishedAt===null||date(s.finishedAt));
      var initial={}, retries={}, seen={}, expectedAnswers={};
      s.steps.forEach(function(step,i){
        check(record(step)&&own(map,step.wordId)&&(['intro'].concat(KINDS)).includes(step.kind));
        fields(step,['wordId','kind','options','retry']);
        check(step.retry===undefined||step.retry===true);
        if(step.options!==undefined){check(Array.isArray(step.options)&&step.options.length>=2&&step.options.length<=4&&new Set(step.options).size===step.options.length&&step.options.every(function(id){return own(map,id);})&&step.options.includes(step.wordId));}
        if(step.kind==='meaning'||step.kind==='listen')check(Array.isArray(step.options));
        if(step.kind==='intro'){check(!step.retry&&!seen[step.wordId]);seen[step.wordId]=true;}
        else if(step.retry){retries[step.wordId]=(retries[step.wordId]||0)+1;check(!!initial[step.wordId]&&retries[step.wordId]<=2);}
        else {check(!initial[step.wordId]);initial[step.wordId]=step;}
        if(step.kind!=='intro'&&(i<s.index||(i===s.index&&s.feedback!==null)||s.finishedAt!==null))expectedAnswers[step.wordId]=true;
      });
      check(Object.keys(expectedAnswers).length===Object.keys(s.answers).length);
      Object.keys(s.answers).forEach(function(id){
        var a=s.answers[id];check(own(map,id)&&own(expectedAnswers,id)&&record(a)&&typeof a.correct==='boolean'&&typeof a.hinted==='boolean'&&date(a.at)&&typeof a.value==='string'&&a.value.length<=300&&a.kind===initial[id].kind);
        fields(a,['correct','hinted','kind','at','value']);check(!!a.value.trim());
        check(a.correct===(normalized(a.value)===normalized(map[id].word)));
        if(s.mode==='learn'){var c=raw.cards[id];check(!!c&&c.lastAt===a.at);if(!a.correct||a.hinted)check(c.streak===0&&c.due===a.at+DAY);else check(c.streak>0&&c.due===a.at+DAY*[1,3,7][Math.min(c.streak-1,2)]);}
      });
      Object.keys(retries).forEach(function(id){check(own(s.answers,id)&&(!s.answers[id].correct||s.answers[id].hinted));});
      var current=s.steps[s.index];
      check(s.feedback===null||record(s.feedback));
      if(s.feedback!==null){fields(s.feedback,['correct','answer','wordId']);check(current.kind!=='intro'&&s.feedback.wordId===current.wordId&&s.feedback.answer===map[current.wordId].word&&typeof s.feedback.correct==='boolean'&&own(s.answers,current.wordId)&&!!s.draft.trim()&&s.feedback.correct===(normalized(s.draft)===normalized(map[current.wordId].word)));if(!current.retry)check(s.feedback.correct===s.answers[current.wordId].correct&&s.hinted===s.answers[current.wordId].hinted&&s.draft===s.answers[current.wordId].value);}
      if(current.kind==='intro')check(s.feedback===null&&!s.hinted);
      if(s.finishedAt!==null)check(s.index===s.steps.length-1&&Object.keys(s.answers).length===Object.keys(initial).length&&s.feedback===null&&Object.values(s.answers).every(function(a){return a.at<=s.finishedAt;}));
    }
    return copy(raw);
  }
  function plan(state,words,now){
    check(date(now));
    var due=[],fresh=[],nextDue=null;
    words.forEach(function(w){var c=state.cards[w.id];if(!c)fresh.push(w.id);else if(c.due<=now)due.push(w.id);else if(nextDue===null||c.due<nextDue)nextDue=c.due;});
    due.sort(function(a,b){return state.cards[a].due-state.cards[b].due;});
    return {due:due,fresh:fresh,nextDue:nextDue};
  }
  function shuffle(items,seed){
    var result=items.slice(),x=seed>>>0;
    for(var i=result.length-1;i>0;i--){x=(Math.imul(x,1664525)+1013904223)>>>0;var j=x%(i+1),t=result[i];result[i]=result[j];result[j]=t;}
    if(result.length>1&&result.every(function(v,i){return v===items[i];}))result.push(result.shift());
    return result;
  }
  function question(id,kind,words,seed,retry){
    var step={wordId:id,kind:kind};
    if(kind==='meaning'||kind==='listen')step.options=shuffle([id].concat(shuffle(words.map(function(w){return w.id;}).filter(function(w){return w!==id;}),seed).slice(0,3)),seed+1);
    if(retry)step.retry=true;
    return step;
  }
  function begin(state,words,now,options){
    check(date(now));wordMap(words);
    if(state.session&&state.session.finishedAt===null)return state;
    var practice=!!(options&&options.practice),p=plan(state,words,now),steps=[];
    if(!practice&&!p.due.length&&!p.fresh.length)return state;
    (practice?shuffle(words.map(function(w){return w.id;}),now):p.due).forEach(function(id,i){var card=state.cards[id];steps.push(question(id,KINDS[(card?card.reviews:i)%4],words,now+i));});
    if(!practice)for(var i=0;i<p.fresh.length;i+=5){var group=p.fresh.slice(i,i+5);group.forEach(function(id){steps.push({wordId:id,kind:'intro'});});shuffle(group,now+i).forEach(function(id,j){steps.push(question(id,KINDS[(i+j)%4],words,now+i+j));});}
    var result=copy(state);result.session={id:'word-pilot-'+now,mode:practice?'practice':'learn',steps:steps,index:0,answers:{},feedback:null,draft:'',hinted:false,finishedAt:null};return result;
  }
  function active(state){return state.session&&state.session.finishedAt===null;}
  function setDraft(state,text){if(!active(state)||state.session.feedback||state.session.steps[state.session.index].kind==='intro')return state;check(typeof text==='string');var out=copy(state);out.session.draft=text.slice(0,300);return out;}
  function hint(state){if(!active(state)||state.session.feedback||state.session.steps[state.session.index].kind==='intro'||state.session.hinted)return state;var out=copy(state);out.session.hinted=true;return out;}
  function answer(state,words,value,now){
    if(!active(state)||state.session.feedback||state.session.steps[state.session.index].kind==='intro')return state;
    check(date(now)&&typeof value==='string'&&value.length<=300);
    if(!value.trim())return state;
    var map=wordMap(words),out=copy(state),s=out.session,step=s.steps[s.index],id=step.wordId,correct=normalized(value)===normalized(map[id].word);
    s.draft=value;s.feedback={correct:correct,answer:map[id].word,wordId:id};
    if(!own(s.answers,id)){
      s.answers[id]={correct:correct,hinted:s.hinted,kind:step.kind,at:now,value:value};
      if(s.mode!=='practice'){var old=out.cards[id],streak=correct&&!s.hinted?(old?old.streak:0)+1:0;out.cards[id]={due:now+DAY*[1,3,7][Math.min(Math.max(streak-1,0),2)],streak:streak,reviews:(old?old.reviews:0)+1,lastAt:now};}
    }
    if((!correct||s.hinted)&&s.steps.filter(function(x){return x.wordId===id&&x.retry;}).length<2){var kind=KINDS[(KINDS.indexOf(step.kind)+1)%4];s.steps.splice(Math.min(s.index+4,s.steps.length),0,question(id,kind,words,now+s.index,true));}
    return out;
  }
  function next(state,now){
    if(!active(state))return state;
    var s=state.session;if(s.steps[s.index].kind!=='intro'&&!s.feedback)return state;
    check(date(now));var out=copy(state);s=out.session;s.draft='';s.hinted=false;s.feedback=null;
    if(s.index+1<s.steps.length)s.index++;else s.finishedAt=now;return out;
  }
  function summary(session){
    var result={total:0,correct:0,hinted:0,wrong:[]};if(!session)return result;
    Object.keys(session.answers).forEach(function(id){var a=session.answers[id];result.total++;if(a.hinted)result.hinted++;if(a.correct&&!a.hinted)result.correct++;else result.wrong.push(id);});return result;
  }
  return {empty:empty,restore:restore,plan:plan,begin:begin,answer:answer,next:next,setDraft:setDraft,hint:hint,summary:summary};
});
