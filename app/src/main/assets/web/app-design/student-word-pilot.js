/* The pilot shares account storage, but never changes formal mastery records. */
(()=>{
  'use strict';
  window.GrowingStudentWordPilot={create({storage,active=()=>{},now=()=>Date.now(),speech={stop(){},play(){}}}){
    const D=window.GrowingWordPilotData,C=window.GrowingWordPilotCore,E=window.GrowingEnglishEngine;
    const key='growing-english-course-v1:'+D.unitId,words=D.words,listeners=new Set();
    let state=C.empty(),base='null',view='home',selected=words[0],notice='',error='',unsaved=false,closed=false;
    const guard=()=>{if(closed)throw Error('词汇练习已关闭，请重新进入。');active();};
    const read=()=>{guard();const raw=storage.getItem(key),value=raw===null?null:JSON.parse(raw);E.restore(value);return value||E.restore(null);};
    function snapshot(){
      const session=state.session,step=session?.steps[session.index],word=view==='card'?selected:words.find(w=>w.id===step?.wordId)||selected;
      return {view,state,step,word,words,notice,error,unsaved,plan:C.plan(state,words,now()),summary:session?C.summary(session):null,
        options:step?.options?.map(id=>words.find(w=>w.id===id))||[],resumable:!!session&&!session.finishedAt};
    }
    let model;
    function emit(){if(closed)return;model=snapshot();listeners.forEach(fn=>fn(model));}
    function load(){
      guard();try{const raw=read();state=raw.wordPilot===undefined?C.empty():C.restore(raw.wordPilot,words);base=JSON.stringify(raw.wordPilot??null);error='';notice='';unsaved=false;view='home';}
      catch(e){error='练习记录暂时无法读取，原记录已保留：'+e.message;}
      emit();
    }
    function save(){
      guard();try{
        const latest=read();
        if(JSON.stringify(latest.wordPilot??null)!==base)throw Error('另一页面已更新练习记录。当前答案仍保留在此页；请重新读取已保存记录后继续。');
        guard();storage.setItem(key,JSON.stringify({...latest,wordPilot:state}));base=JSON.stringify(state);unsaved=false;notice='';
      }catch(e){unsaved=true;notice='本次练习尚未保存：'+e.message;}
      emit();
    }
    const change=next=>{if(next===state)return;state=next;save();};
    const ready=()=>{guard();return !error&&!unsaved;};
    const actions={
      start(practice=false){
        if(!ready())return;speech.stop();
        if(state.session&&!state.session.finishedAt){view='session';emit();return;}
        const plan=C.plan(state,words,now());
        if(!practice&&!plan.due.length&&!plan.fresh.length){notice='今天的学习已完成，可以回看词卡，或再练一轮。';emit();return;}
        view='session';change(C.begin(state,words,now(),{practice}));
      },
      next(){if(!ready())return;speech.stop();change(C.next(state,now()));},
      input(value){guard();if(error||state.session?.feedback)return;change(C.setDraft(state,String(value).slice(0,80)));},
      answer(value){if(!ready())return;const answer=String(value??state.session?.draft??'').trim();if(!answer)return;change(C.answer(state,words,answer,now()));},
      hint(){if(!ready())return;change(C.hint(state));},
      retrySave(){guard();if(!error&&unsaved)save();},
      reload(){guard();speech.stop();load();},
      home(){guard();speech.stop();view='home';emit();},
      card(id){
        guard();const word=words.find(w=>w.id===id);if(!word)return;speech.stop();
        const s=state.session,step=s?.steps[s.index];
        if(s&&!s.finishedAt&&!s.feedback&&step.kind!=='intro'&&step.wordId===id)change(C.hint(state));
        selected=word;view='card';emit();
      },
      speak(){guard();speech.play({id:model.word.word},{rate:.85});}
    };
    load();
    return {get model(){return model;},actions,subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},destroy(){if(closed)return;closed=true;speech.stop();listeners.clear();}};
  }};
})();
