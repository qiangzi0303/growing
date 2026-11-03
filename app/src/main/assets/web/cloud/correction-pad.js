/* Inline correction originals use the shared handwriting stroke format. */
(()=>{
  'use strict';
  window.GrowingCorrectionPad={mount(root,draft,changed,report){
    const C=window.GrowingHandwriting;
    draft.pages??=[[]];
    let page=Math.min(draft.page||0,draft.pages.length-1),tool='pen',active=null,disabled=false;
    root.innerHTML='<div class="actions correction-tools" role="group" aria-label="手写工具"><strong>手写答案</strong><button type="button" data-pad="pen" aria-pressed="true">画笔</button><button type="button" data-pad="eraser" aria-pressed="false">橡皮</button><button type="button" data-pad="undo">撤销</button><button type="button" data-pad="clear">清空本页</button></div><canvas width="800" height="1100" aria-label="手写答案画布，可使用鼠标、手指或手写笔书写"></canvas><div class="actions correction-pages"><button type="button" data-pad="prev" aria-label="上一页手写答案">上一页</button><span data-pad-page></span><button type="button" data-pad="next" aria-label="下一页手写答案">下一页</button><button type="button" data-pad="add">续页</button></div>';
    const canvas=root.querySelector('canvas'),count=()=>draft.pages.reduce((n,p)=>n+p.reduce((n,s)=>n+s.points.length,0),0);
    function paint(){
      C.draw(canvas,draft.pages[page]);
      root.querySelector('[data-pad-page]').textContent=`第 ${page+1} / ${draft.pages.length} 页`;
      root.querySelectorAll('[data-pad]').forEach(b=>{
        const action=b.dataset.pad;
        b.disabled=disabled||!!active||action==='prev'&&page===0||action==='next'&&page===draft.pages.length-1||action==='add'&&draft.pages.length>=4||['undo','clear'].includes(action)&&!draft.pages[page].length;
        if(['pen','eraser'].includes(action))b.setAttribute('aria-pressed',String(tool===action));
      });
      canvas.setAttribute('aria-disabled',String(disabled));
    }
    function point(e){const b=canvas.getBoundingClientRect();return [Math.round(Math.max(0,Math.min(C.WIDTH,(e.clientX-b.left)*C.WIDTH/b.width))),Math.round(Math.max(0,Math.min(C.HEIGHT,(e.clientY-b.top)*C.HEIGHT/b.height))),Math.round((e.pointerType==='pen'?Math.max(.05,e.pressure||.5):.5)*100)/100];}
    canvas.addEventListener('pointerdown',e=>{
      if(disabled||active||e.button!==0&&!(e.pointerType==='pen'&&e.button===5))return;
      if(count()>=C.MAX_POINTS||draft.pages[page].length>=3000){report('本份手写笔迹已达上限，请先提交批改。',true);return;}
      e.preventDefault();canvas.setPointerCapture(e.pointerId);
      const erasing=tool==='eraser'||e.button===5;
      active={id:e.pointerId,stroke:{tool:erasing?'eraser':'pen',width:erasing?28:4,points:[point(e)]},remaining:C.MAX_POINTS-count()-1};
      C.draw(canvas,[...draft.pages[page],active.stroke]);
    });
    canvas.addEventListener('pointermove',e=>{
      if(active?.id!==e.pointerId)return;e.preventDefault();
      for(const p of e.getCoalescedEvents?.().length?e.getCoalescedEvents():[e]){if(active.remaining--<=0)break;active.stroke.points.push(point(p));}
      C.draw(canvas,[...draft.pages[page],active.stroke]);
    });
    function finish(e){if(!active||e&&active.id!==e.pointerId)return;draft.pages[page].push(active.stroke);active=null;changed();paint();}
    for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,finish);
    const flush=()=>finish(),visibility=()=>{if(document.hidden)finish();};
    window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',visibility);
    root.addEventListener('click',e=>{
      const action=e.target.closest('[data-pad]')?.dataset.pad;if(!action||disabled||active)return;
      if(['pen','eraser'].includes(action))tool=action;
      if(action==='undo'){draft.pages[page].pop();changed();}
      if(action==='clear'&&draft.pages[page].length&&window.confirm('清空本页手写答案？')){draft.pages[page]=[];changed();}
      if(action==='prev')page=Math.max(0,page-1);
      if(action==='next')page=Math.min(draft.pages.length-1,page+1);
      if(action==='add'&&draft.pages.length<4){draft.pages.push([]);page=draft.pages.length-1;changed();}
      draft.page=page;paint();
    });
    paint();
    return {
      lock(value){finish();disabled=value;paint();},
      dispose(){finish();window.removeEventListener('pagehide',flush);document.removeEventListener('visibilitychange',visibility);},
      images(){
        finish();
        const pages=draft.pages.filter(strokes=>{const c=document.createElement('canvas');c.width=C.WIDTH;c.height=C.HEIGHT;C.draw(c,strokes);return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0);}).map(strokes=>{
          const c=document.createElement('canvas');c.width=C.WIDTH;c.height=C.HEIGHT;C.draw(c,strokes);
          const ctx=c.getContext('2d');ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
          return c.toDataURL('image/png');
        });
        if(!pages.length)throw Error('请先在手写区写下本次答案。');
        if(pages.reduce((n,p)=>n+p.length,0)>600000)throw Error('本份手写原稿过大，请减少笔迹或分次提交。');
        return pages;
      }
    };
  }};
})();
