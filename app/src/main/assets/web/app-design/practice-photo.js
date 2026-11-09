/* Application answers use the existing handwritten-original and visual-grading contracts. */
(()=>{
  'use strict';
  const C=window.GrowingHandwriting,A=window.GrowingApplicationPractice;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function create({subject,unit,questions,onChange}){
    const jobs=new Map(),messages=new Map(),unsaved=new Map();
    const find=id=>questions.find(q=>q.id===id);
    const result=q=>A.results(localStorage,subject,unit,[q])[q.id];
    function persist(key,doc){if(!C.validate(doc))throw Error('原稿或批改格式无效');localStorage.setItem(key,JSON.stringify(doc));}
    function markup(q,r){
      const pending=jobs.has(q.id),draft=unsaved.get(q.id),doc=draft?.doc||r?.doc;
      const history=r?.history||[];if(draft)for(const grade of draft.doc.grades)if(!history.some(row=>row.grade.at===grade.at))history.push({grade,key:draft.key});
      return `<div class="practice-upload"><label class="practice-photo-link">${doc?'重新拍照':'手写题目和答案后拍照上传'}<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" data-practice-photo="${esc(q.id)}" ${pending?'disabled':''}></label>${doc?`<details class="practice-original"><summary>查看原稿</summary>${(doc.photos||[]).filter(Boolean).map(src=>`<img src="${src}" alt="本题手写原稿" loading="lazy">`).join('')}</details>`:''}${pending?`<button type="button" data-photo-cancel="${esc(q.id)}">取消批改</button>`:doc?`<button type="button" data-photo-retry="${esc(q.id)}">${draft?'重试保存并批改':'重新批改'}</button>`:''}</div><p class="practice-photo-status" role="status">${esc(messages.get(q.id)||'')}</p><div class="practice-grades">${history.slice().reverse().map(({grade:g,key:historyKey})=>`<article class="practice-grade"><strong>${historyKey!==(draft?.key||r?.key)||g.revision!==doc.revision?'历史批改 · '+(g.needsReview?'待复核':g.score+' / 100'):g.needsReview?'待复核':g.score+' / 100'}</strong><p>${esc(g.feedback)}</p>${g.corrections?.length?`<ul>${g.corrections.map(c=>`<li><strong>${esc(c.location)}</strong>：${esc(c.issue)}<br>订正：${esc(c.correction)}</li>`).join('')}</ul>`:''}<small>${esc(g.at.replace('T',' ').slice(0,19))}</small></article>`).join('')}</div>`;
    }
    async function photo(file){
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw Error('请选择20 MB以内的照片');
      const url=URL.createObjectURL(file),image=new Image();
      try{
        image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=C.WIDTH;canvas.height=C.HEIGHT;
        const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,C.WIDTH,C.HEIGHT);
        const scale=Math.min(C.WIDTH/image.naturalWidth,C.HEIGHT/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;
        ctx.drawImage(image,(C.WIDTH-w)/2,(C.HEIGHT-h)/2,w,h);
        for(const quality of [.9,.8,.65,.5]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<=650000)return data;}
        throw Error('照片过大，请重新拍摄单页答案');
      }finally{URL.revokeObjectURL(url);}
    }
    async function submit(id,file){
      const q=find(id);if(!q||jobs.has(id))return;
      const controller=new AbortController();jobs.set(id,controller);messages.set(id,file?'正在保存照片…':'正在批改…');onChange(q.topic);
      let timer;
      try{
        let saved=unsaved.get(id)||result(q),doc=saved?.doc,key=saved?.key;
        if(file){
          const data=await photo(file);if(controller.signal.aborted)return;
          doc=C.create(subject,unit,A.prompt(q));key=C.PREFIX+crypto.randomUUID();
          C.change(doc);doc.pages=[[]];doc.photos=[data];
        }
        if(!doc?.photos?.some(Boolean))throw Error('请先上传本题的手写照片');
        unsaved.set(id,{key,doc});persist(key,doc);unsaved.delete(id);
        messages.set(id,'AI正在批改…');onChange(q.topic);
        const revision=doc.revision;
        const pages=await Promise.all(doc.pages.map(async(strokes,i)=>{const image=new Image();image.src=doc.photos[i];await image.decode();return GrowingHandwritingAI.pageImage(strokes,C.draw,C.WIDTH,C.HEIGHT,image);}));
        timer=setTimeout(()=>controller.abort(),115000);
        const response=await GrowingHandwritingAI.request({subject,unitId:unit,prompt:doc.prompt,nodeIds:[q.topic],pages},controller.signal);
        if(controller.signal.aborted)return;
        const current=JSON.parse(localStorage.getItem(key)||'null');
        if(!C.validate(current)||current.revision!==revision||current.prompt!==doc.prompt||current.updatedAt!==doc.updatedAt||result(q)?.key!==key)throw Error('原稿已更新，请按最新照片重新批改');
        const grade={...response,revision,at:new Date().toISOString()};
        if(!grade.needsReview&&!C.matchesKnowledge(grade,{nodes:[q.topic]}))throw Error('本题知识点评分不完整，请重试');
        current.grades=[...current.grades,grade].slice(-10);current.updatedAt=grade.at;
        unsaved.set(id,{key,doc:current});persist(key,current);unsaved.delete(id);
        messages.set(id,grade.needsReview?'待复核，请按批改记录补充清晰照片':'批改完成');
      }catch(error){messages.set(id,error.name==='AbortError'?'批改已取消或超时，原稿保留':error.message+'；本次未完成');}
      finally{clearTimeout(timer);jobs.delete(id);onChange(q.topic);}
    }
    function cancel(id){messages.set(id,'批改已取消，原稿保留');jobs.get(id)?.abort();}
    addEventListener('pagehide',()=>{for(const job of jobs.values())job.abort();});
    return {markup,submit,cancel};
  }
  window.GrowingPracticePhoto={create};
})();
