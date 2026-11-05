/* Bundled and photographed questions use the same saved-answer workbench. */
(()=>{
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const root=document.getElementById('questions'),identities=new Map();
  let review=null,workbench=null,studentId='',busy=false,onSaved=()=>{};
  function detach(){if(workbench&&root.contains(workbench))root.before(workbench);}
  function hydrate(saved=onSaved){
    onSaved=saved;
    for(const card of root.querySelectorAll('.question')){
      const id=card.dataset.archiveQuestion,q=GrowingMathWrongQuestions.questions.find(q=>q.id===id);if(!q)continue;
      if(!card.querySelector('[data-unit-answer-history]'))card.insertAdjacentHTML('beforeend',`<div class="actions unit-answer-actions"><label class="button bank-upload">拍照答案<input type="file" accept="image/*" capture="environment" data-unit-answer-camera="${esc(id)}" aria-label="第${q.number}题拍照答案"></label><button type="button" data-unit-answer-history="${esc(id)}" data-review-label="查看答案记录" aria-expanded="false">查看答案记录</button><p data-unit-answer-status role="status"></p></div>`);
      const known=identities.get(id);
      if(known){card.querySelector('[data-unit-answer-history]').dataset.reviewOpen=known.id;card.querySelector('[data-unit-answer-camera]').dataset.reviewCamera=known.id;}
    }
    if(workbench){
      const button=[...root.querySelectorAll('[data-review-open]')].find(b=>b.dataset.reviewOpen===workbench.dataset.anchorQuestion);
      if(button)button.closest('.question').after(workbench);else{root.append(workbench);workbench.hidden=true;}
      review.sync();
    }
  }
  async function open(id,files=[]){
    if(busy)return;busy=true;
    const card=[...root.querySelectorAll('[data-archive-question]')].find(c=>c.dataset.archiveQuestion===id),status=card?.querySelector('[data-unit-answer-status]');
    const report=text=>{if(status?.isConnected)status.textContent=text;};
    try{
      report('正在读取本题作答记录…');
      const context=await GrowingQuestionAttempts.context();if(!context)throw Error('请先登录学生云账号，再拍照提交或查看答案记录。');
      if(studentId&&studentId!==context.studentId)throw Error('账号已切换，请重新打开单元错题。');
      if(!review){
        studentId=context.studentId;workbench=document.createElement('section');workbench.className='panel photo-workbench';workbench.dataset.workbench='';workbench.hidden=true;root.append(workbench);
        review=GrowingPhotoReview.create(root,context.api,esc,()=>root.isConnected,studentId,()=>onSaved(),{mount(){},dispose(){}});
      }
      const data=await context.api('/question-bank/unit-wrong',{method:'POST',body:JSON.stringify({studentId,questionId:id})});
      const archive=GrowingMathWrongQuestions.questions.find(q=>q.id===id);
      for(const q of GrowingMathWrongQuestions.questions.filter(q=>(q.sourceId||'1025141010')===(archive.sourceId||'1025141010'))){
        const saved=data.paper.questions.find(saved=>saved.number===String(q.number));if(saved)identities.set(q.id,saved);
      }
      hydrate();
      if(!files.length&&!workbench.hidden&&workbench.dataset.anchorQuestion===data.question.id){review.close();report('');return;}
      await review.open(data.question);
      if(files.length)await review.addPhotos(data.question.id,files);
      report('');
    }catch(error){report(error.message+'；照片未提交，可重新选择重试。');}
    finally{busy=false;}
  }
  root.addEventListener('change',e=>{
    if(!e.target.matches('[data-unit-answer-camera]'))return;
    const id=e.target.dataset.unitAnswerCamera,files=[...e.target.files];e.target.value='';if(files.length)void open(id,files);
  });
  root.addEventListener('click',e=>{const button=e.target.closest('[data-unit-answer-history]');if(button)void open(button.dataset.unitAnswerHistory);});
  window.GrowingUnitWrongAnswers={detach,hydrate};
  hydrate();
})();
