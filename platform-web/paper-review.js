/* One review controller for photographed papers and submitted examinations. */
(()=>{
  'use strict';
  window.GrowingPaperReview={mount(root,api,esc,alive,studentId,paper,cardFor,onSaved=()=>{}){
    const host=document.createElement('section');host.className='panel photo-workbench';host.dataset.workbench='';host.hidden=true;root.append(host);
    let disposed=false;
    const valid=()=>!disposed&&alive()&&root.isConnected;
    const figures=GrowingQuestionFigures.create(api,esc,valid,studentId,()=>review.refresh());
    const review=GrowingPhotoReview.create(root,api,esc,valid,studentId,async()=>{
      const saved=await api('/question-bank/papers/'+paper.id+'?'+new URLSearchParams({studentId}));
      if(!valid())return;
      paper=saved;mark();await onSaved(saved);
    },figures);
    function mark(){
      for(const q of paper.questions){
        const card=cardFor(q);if(!card)continue;
        const g=q.grades?.at(-1),wrong=g?.revision===q.revision&&['incorrect','partial'].includes(g.result.verdict);
        card.classList.toggle('paper-review-wrong',!!wrong);
        if(g?.revision===q.revision){card.classList.remove('paper-wrong','is-wrong');}
      }
    }
    for(const q of paper.questions){
      const card=cardFor(q);if(!card)continue;card.classList.add('bank-question');
      const button=document.createElement('button');button.type='button';button.className='paper-review-toggle';button.dataset.reviewOpen=q.id;button.textContent='此题批改';
      card.append(button);
    }
    async function click(event){
      const button=event.target.closest('[data-review-open]');if(!button||!root.contains(button)||!valid()||button.disabled)return;
      event.stopPropagation();
      if(!host.hidden&&host.dataset.anchorQuestion===button.dataset.reviewOpen){review.close();return;}
      const q=paper.questions.find(q=>q.id===button.dataset.reviewOpen);if(q)try{await review.open(q);}catch(error){host.hidden=false;host.textContent=error.message;}
    }
    root.addEventListener('click',click);mark();review.sync();
    return {close:()=>review.close(),dispose(){if(disposed)return;disposed=true;root.removeEventListener('click',click);review.dispose();host.remove();root.querySelectorAll('.paper-review-toggle').forEach(b=>b.remove());}};
  }};
})();
