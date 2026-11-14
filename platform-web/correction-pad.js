/* Inline correction originals use the shared handwriting stroke format. */
(()=>{
  'use strict';
  async function photo(file,budget){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw Error('请选择20 MB以内的JPG、PNG或WebP答案照片。');
    const url=URL.createObjectURL(file),image=new Image();
    try{
      image.src=url;await image.decode();
      if(!image.naturalWidth||image.naturalWidth*image.naturalHeight>64000000)throw Error('照片尺寸过大，请裁剪本题答案后重试。');
      const canvas=document.createElement('canvas');let scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
      for(let i=0;i<12;i++){
        canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
        const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
        const png=canvas.toDataURL('image/png');if(png.length<=budget)return png;scale*=.8;
      }
      throw Error('答案照片过大，请裁剪后重试。');
    }finally{URL.revokeObjectURL(url);}
  }
  window.GrowingCorrectionPad={mount(root,draft,changed,report){
    let disabled=false;
    root.innerHTML='<div class="actions"><label class="button bank-upload">拍照答案<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" data-answer-camera></label><label class="button bank-upload">从相册选择<input type="file" accept="image/jpeg,image/png,image/webp" multiple data-answer-album></label></div><ol class="bank-photos" data-answer-photos></ol><details data-legacy-ink><summary>查看以前保存的笔迹（只读）</summary></details>';
    const legacy=root.querySelector('[data-legacy-ink]');legacy.hidden=!(draft.pages||[]).some(page=>page.length);
    if(!legacy.hidden)for(const [i,page] of draft.pages.entries()){const canvas=document.createElement('canvas');canvas.width=800;canvas.height=1100;canvas.setAttribute('aria-label',`历史笔迹第 ${i+1} 页，只读`);window.GrowingHandwriting.draw(canvas,page);legacy.append(canvas);}
    function paint(){
      const previews=root.querySelector('[data-answer-photos]');previews.replaceChildren();
      for(const [i,image] of (draft.photos||[]).entries()){
        const item=document.createElement('li'),img=document.createElement('img'),remove=document.createElement('button');
        img.src=image;img.alt=`本次答案第 ${i+1} 页`;remove.type='button';remove.dataset.answerRemove=String(i);remove.textContent='移除';remove.disabled=disabled;item.append(img,remove);previews.append(item);
      }
      root.querySelectorAll('input').forEach(el=>el.disabled=disabled);
    }
    async function addPhotos(files){
      if(disabled)return;
      const all=[...(draft.photos||[]),...files];if(all.length>4)throw Error('本次最多4页答案，请先移除多余照片。');
      disabled=true;paint();
      try{const added=[],budget=Math.floor(580000/all.length);for(const file of all){const source=typeof file==='string'?await(await fetch(file)).blob():file;added.push(await photo(source,budget));}draft.photos=added;draft.answerMode='photo';changed();}finally{disabled=false;paint();}
    }
    const change=async e=>{if(!e.target.matches('[data-answer-camera],[data-answer-album]'))return;const files=[...e.target.files];e.target.value='';if(!files.length)return;try{await addPhotos(files);}catch(error){report(error.message,true);}};
    const click=e=>{const remove=e.target.closest('[data-answer-remove]');if(remove&&!disabled){draft.photos.splice(Number(remove.dataset.answerRemove),1);changed();paint();}};
    root.addEventListener('change',change);root.addEventListener('click',click);paint();
    return {lock(value){disabled=value;paint();},dispose(){root.removeEventListener('change',change);root.removeEventListener('click',click);},images(){if(disabled)throw Error('正在处理照片，请稍后提交。');if(!draft.photos?.length)throw Error('请先拍照或选择本题的答案照片。');return [...draft.photos];},addPhotos};
  }};
})();
