/* Each paper upload is an independent, schema-compatible original. */
(function(root){
 'use strict';
 root.GrowingPaperPhotoUploads={create({storage,paper,unitFor,active=()=>{}}){
  const C=root.GrowingHandwriting;
  const check=()=>{if(active()===false)throw Error('学习账号已切换');};
  const question=n=>paper.questions.find(q=>String(q.n)===String(n)&&q.type==='solution');
  const prompt=q=>`【检测卷 ${paper.id} · 第${q.n}题】\n${q.prompt}`;
  function get(n,key){
   check();const q=question(n);if(!q||!C.KEY.test(key))return null;
   try{const doc=JSON.parse(storage.getItem(key)||'null');if(!C.validate(doc)||doc.subject!=='math'||doc.unitId!==unitFor(q)||doc.prompt!==prompt(q)||!doc.photos?.some(Boolean))return null;return {key,at:doc.updatedAt,photos:doc.photos.filter(Boolean)};}catch{return null;}
  }
  function list(n){check();const rows=[];for(let i=0;i<storage.length;i++){const row=get(n,storage.key(i));if(row)rows.push(row);}return rows.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||b.key.localeCompare(a.key));}
  async function upload(n,file){
   check();const q=question(n);if(!q)throw Error('题目不存在');
   if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw Error('请选择20 MB以内的照片');
   const url=root.URL.createObjectURL(file),image=new root.Image();let photo;
   try{image.src=url;await image.decode();check();if(!(image.naturalWidth>0&&image.naturalHeight>0)||image.naturalWidth*image.naturalHeight>64000000)throw Error('照片尺寸无效或过大，请重新拍摄');const canvas=root.document.createElement('canvas');canvas.width=C.WIDTH;canvas.height=C.HEIGHT;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,C.WIDTH,C.HEIGHT);const scale=Math.min(C.WIDTH/image.naturalWidth,C.HEIGHT/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,(C.WIDTH-w)/2,(C.HEIGHT-h)/2,w,h);for(const quality of [.9,.8,.65,.5]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<=650000){photo=data;break;}}if(!photo)throw Error('照片过大，请重新拍摄单页答案');}finally{root.URL.revokeObjectURL(url);}
   check();const doc=C.create('math',unitFor(q),prompt(q));doc.photos=[photo];C.change(doc);if(!C.validate(doc))throw Error('照片原稿格式无效');const key=C.PREFIX+root.crypto.randomUUID();storage.setItem(key,JSON.stringify(doc));return {key,at:doc.updatedAt,photos:[photo]};
  }
  return {list,get,upload};
 }};
})(globalThis);
