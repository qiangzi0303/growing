/* Progress comes from persisted server steps, never from elapsed time. */
(()=>{
  'use strict';
  window.GrowingGradingProgress={run({api,studentId,job=null,create,alive,onJob=()=>{}}){
    return new Promise(resolve=>{
      const previous=document.activeElement,d=document.createElement('dialog'),id='grading-'+crypto.randomUUID();
      d.className='grading-progress';d.setAttribute('aria-labelledby',id);
      d.innerHTML=`<h2 id="${id}">正在批改试卷</h2><p data-stage role="status" aria-live="polite">正在保存照片…</p><div class="grading-progress-meter"><progress max="100" aria-label="试卷批改完成比例"></progress><strong data-percent></strong></div><p data-count></p><p data-error role="alert" hidden></p><div class="actions"><button type="button" data-retry hidden>重试</button><button type="button" data-close aria-label="暂存并关闭" title="暂存并关闭" style="width:44px;height:44px;padding:0;font-size:28px;line-height:1;flex:0 0 44px">×</button></div>`;
      const $=s=>d.querySelector(s),bar=$('progress');
      let closed=false,running=false,pollTimer=null,pollController=null,stepController=null,stepTimer=null;
      const current=()=>!closed&&alive();
      function close(result=null){
        if(closed)return;closed=true;clearTimeout(pollTimer);pollController?.abort();observer.disconnect();
        // A submitted server step may finish and persist; closing stops subsequent steps.
        d.close();d.remove();if(previous?.isConnected)previous.focus();resolve(result);
      }
      function render(value){
        if(!current()||job&&value.revision<job.revision)return;
        job=value;onJob(value);
        const done=value.status==='complete',known=Number.isFinite(value.progressPercent);
        if(known)bar.value=value.progressPercent;else bar.removeAttribute('value');
        $('[data-percent]').textContent=known?value.progressPercent+'%':'';
        $('[data-stage]').textContent=done?'批改完成':value.status==='planning'?'正在清点试卷题目…':'第 '+(value.next?.number||'?')+' 题 · '+(window.GrowingQuestionFigures?.importStage(value.next)||'批改作答');
        $('[data-count]').textContent=!known?'已清点 '+value.plannedPages+' / '+value.pageCount+' 页':'已完成 '+value.completedQuestions+' / '+value.totalQuestions+' 题';
        if(done){$('[data-close]').setAttribute('aria-label','查看批改');$('[data-close]').title='查看批改';$('[data-retry]').hidden=true;}
      }
      const path=()=>'/question-bank/import-jobs/'+job.id;
      const query='?'+new URLSearchParams({studentId});
      async function poll(){
        if(!current()){close();return;}
        const controller=new AbortController();pollController=controller;
        try{const value=await api(path()+'/progress'+query,{signal:controller.signal});if(current())render(value);}
        catch{/* The step response remains authoritative; failures are shown by advance(). */}
        finally{if(pollController===controller)pollController=null;if(current()&&running)pollTimer=setTimeout(poll,1500);}
      }
      async function advance(){
        if(running||!current())return;running=true;$('[data-error]').hidden=true;$('[data-retry]').hidden=true;
        try{
          if(!job)render(await create());
          if(!current())return;
          pollTimer=setTimeout(poll,1500);
          while(current()){
            render(await api(path()+'/progress'+query));
            if(!current()||job.status==='complete')break;
            // Another tab may own this step. Do not start duplicate AI requests.
            if(job.processing){await new Promise(r=>setTimeout(r,1500));continue;}
            const detail=await api(path()+query);if(!current())return;
            const attachments=await GrowingQuestionFigures.prepareImportStep(detail.next,detail.sourcePages);if(!current())return;
            const controller=new AbortController();stepController=controller;
            stepTimer=setTimeout(()=>controller.abort(),190000);
            let next;
            try{next=await api(path()+'/step',{method:'POST',signal:controller.signal,body:JSON.stringify({studentId,revision:detail.revision,workflow:'visual-v1',...attachments})});}
            catch(error){if(error.status===409||error.statusCode===409)continue;throw error;}
            finally{clearTimeout(stepTimer);stepController=null;}
            if(!current())break;render(next);
            if(job.status==='failed')throw Error(job.error||'本题批改失败，请重试。');
          }
        }catch(error){if(current()){
          $('[data-stage]').textContent='批改已中断';$('[data-error]').hidden=false;
          $('[data-error]').textContent=(error.name==='AbortError'?'请求超时。':error.message)+' 已保存的进度与原稿保留。';$('[data-retry]').hidden=false;
        }}finally{running=false;clearTimeout(pollTimer);pollController?.abort();if(!alive())close();}
      }
      $('[data-close]').onclick=()=>close(job?.status==='complete'?job:null);
      $('[data-retry]').onclick=advance;
      d.addEventListener('cancel',event=>{event.preventDefault();close();});
      const observer=new MutationObserver(()=>{if(!alive())close();});observer.observe(document.body,{childList:true,subtree:true});
      document.body.append(d);d.showModal();advance();
    });
  }};
})();
