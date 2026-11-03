/* Saved handwriting and teacher marks are separate, immutable layers. */
(()=>{
  'use strict';
  const verdicts={correct:'正确',partial:'部分正确',incorrect:'需要订正',unanswered:'未作答',review:'待人工核对'};
  window.GrowingGradedAnswer={mount(root,grade,question,paper,esc,render){
    const result=grade.result,annotations=result.answerAnnotations||[];
    let sources=(result.answerPages||[]).map((image,i)=>({image,page:i+1,handwritten:true}));
    if(!sources.length&&grade.kind==='initial'){
      const regions=result.answerRegions?.length?result.answerRegions:question.regions||[];
      sources=regions.flatMap(region=>{const image=paper.pages?.find(p=>p.page===region.page)?.image;return image?[{image,page:region.page,region}]:[];});
    }
    root.className='photo-graded-answer';root.dataset.gradeId=grade.id;
    const score=verdicts[result.verdict];
    const at=grade.at&&Number.isFinite(Date.parse(grade.at))?new Date(grade.at).toLocaleString('zh-CN',{hour12:false}):'';
    const notes=`<div class="photo-grading-notes"><strong>批改记录 · ${esc(score)}</strong><div class="bank-text math-prose">${render(result.feedback)}</div>${annotations.map((a,i)=>`<div class="photo-grading-mark"><strong>第 ${a.page} 页 · 标记 ${i+1} · ${esc(verdicts[a.kind])}</strong><div class="bank-text math-prose">${render(a.comment)}</div></div>`).join('')}${result.corrections.map(c=>`<article class="photo-grading-mark"><strong>${esc(c.location)}</strong><div class="bank-text math-prose">${render(c.issue)}</div><strong>怎样改</strong><div class="bank-text math-prose">${render(c.correction)}</div></article>`).join('')}</div>`;
    root.innerHTML=`<header><strong>${esc(grade.kind==='initial'?'首次作答与批改':'本次作答与批改')}</strong>${at?`<time datetime="${esc(grade.at)}">${esc(at)}</time>`:''}</header><div data-graded-pages></div>${sources.length?`<details class="photo-answer-transcription"><summary>识别文字</summary><div class="bank-text math-prose">${render(result.studentAnswer||'未识别到作答')}</div></details>`:`<div class="bank-text math-prose">${render(result.studentAnswer||'本条记录未保存可显示的手写原稿。')}</div>${notes}`}`;
    sources.forEach(source=>{
      const figure=document.createElement('figure'),canvas=document.createElement('canvas'),caption=document.createElement('figcaption');
      canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`第${source.page}页作答与红色批改：${score}`);
      const sheet=document.createElement('div');sheet.className='photo-graded-sheet';sheet.append(canvas);
      caption.textContent=`第 ${source.page} 页`;figure.append(sheet,caption);
      if(source===sources[0])sheet.insertAdjacentHTML('beforeend',notes);
      root.querySelector('[data-graded-pages]').append(figure);
      const image=new Image();
      image.onload=()=>{
        if(!root.isConnected)return;
        const r={...(source.region||{x:0,y:0,width:1,height:1})};
        if(source.handwritten){
          // Trim only empty bottom space in the view; the saved original stays complete.
          const scan=document.createElement('canvas');scan.width=image.naturalWidth;scan.height=image.naturalHeight;
          const scanContext=scan.getContext('2d');scanContext.drawImage(image,0,0);
          const data=scanContext.getImageData(0,0,scan.width,scan.height).data;
          let bottom=0;
          for(let y=scan.height-1;y>=0&&!bottom;y--)for(let x=0;x<scan.width;x++){const i=(y*scan.width+x)*4;if(data[i+3]>16&&data[i]+data[i+1]+data[i+2]<735){bottom=y+1;break;}}
          for(const a of annotations)if(a.page===source.page)bottom=Math.max(bottom,(a.y+a.height)*scan.height);
          r.height=Math.min(1,Math.max(240,bottom+64)/scan.height);
        }
        const w=image.naturalWidth*r.width,h=image.naturalHeight*r.height;
        const height=Math.max(1,Math.round(800*h/w));
        // Preserve proportions while bounding decoded canvas memory for old source crops.
        const scale=Math.min(1,3000/height);canvas.width=Math.round(800*scale);canvas.height=Math.round(height*scale)+64;
        const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='#b42318';ctx.font='bold 32px "Microsoft YaHei",sans-serif';ctx.fillText(`第 ${source.page} 页 · ${score}`,16,42);
        ctx.drawImage(image,image.naturalWidth*r.x,image.naturalHeight*r.y,w,h,0,64,canvas.width,canvas.height-64);
        // The overall mark is not a fabricated location of a specific step.
        ctx.fillStyle='#b42318';ctx.font='bold 64px sans-serif';ctx.fillText(result.verdict==='correct'?'✓':result.verdict==='incorrect'?'×':'?',canvas.width-76,132);
        if(!source.region)annotations.forEach((a,i)=>{
          if(a.page!==source.page)return;
          const x=a.x*canvas.width,y=64+a.y/r.height*(canvas.height-64),width=a.width*canvas.width,height=a.height/r.height*(canvas.height-64);
          ctx.strokeStyle=ctx.fillStyle='#b42318';ctx.lineWidth=3;ctx.strokeRect(x,y,width,height);
          const cx=Math.max(14,Math.min(canvas.width-14,x)),cy=Math.max(80,y);
          ctx.beginPath();ctx.arc(cx,cy,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText(String(i+1),cx,cy+6);ctx.textAlign='left';
        });
        const ink=sheet.querySelector('.photo-grading-notes');
        if(ink){
          // Keep selectable KaTeX teacher ink on the same sheet, above the canvas background.
          const original=document.createElement('canvas');original.width=canvas.width;original.height=canvas.height;
          original.getContext('2d').drawImage(canvas,0,0);
          const layout=()=>{
            if(!canvas.isConnected){observer.disconnect();return;}
            const height=original.height+Math.ceil(ink.getBoundingClientRect().height*canvas.width/Math.max(1,canvas.getBoundingClientRect().width));
            if(canvas.height===height)return;
            canvas.height=height;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,height);ctx.drawImage(original,0,0);
          };
          const observer=new ResizeObserver(layout);observer.observe(ink);observer.observe(sheet);layout();
        }
        figure.dataset.loaded='true';
      };
      image.onerror=()=>{canvas.remove();caption.textContent=`第 ${source.page} 页原稿加载失败，请重新打开本题；批改记录仍保留。`;caption.className='warning';};
      image.src=source.image;
    });
  }};
})();
