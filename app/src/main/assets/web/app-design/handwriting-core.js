/* Vector originals contain no image URLs or model credentials. Shared with the portal. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingHandwriting=factory();})(globalThis,()=>{
  'use strict';
  const PREFIX='growing-handwriting-v1:',KEY=/^growing-handwriting-v1:[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
  const WIDTH=800,HEIGHT=1100,MAX_POINTS=18000,MAX_PAGES=8;
  const units=s=>s==='math'?['01','02','03','04','05'].map(n=>'math-8a-'+n).concat(['06','07','08','09','10','11'].map(n=>'math-8b-'+n)):s==='physics'?['01','02','03','04','05'].map(n=>'physics-8a-'+n):s==='english'?Array.from({length:8},(_,i)=>'english-8a-0'+(i+1)):[];
  const str=(v,n)=>typeof v==='string'&&v.length<=n;
  const integer=(v,n)=>Number.isInteger(v)&&v>=0&&v<=n;
  const strings=(v,n,max)=>Array.isArray(v)&&v.length<=n&&v.every(x=>str(x,max));
  const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(v,k));
  const timestamp=v=>str(v,30)&&Number.isFinite(Date.parse(v));
  function grade(v){
    return exact(v,['revision','at','score','parts','feedback','needsReview'])&&integer(v.revision,1e9)&&timestamp(v.at)&&str(v.feedback,8000)&&typeof v.needsReview==='boolean'&&
      (v.needsReview?v.score===null&&v.parts===null:integer(v.score,100)&&Array.isArray(v.parts)&&v.parts.length===4&&v.parts.every(x=>integer(x,100))&&v.parts.reduce((a,b)=>a+b,0)===v.score);
  }
  function validate(d){
    if(!exact(d,['version','unitId','subject','mode','prompt','pages','revision','recognition','grades','updatedAt'])||d.version!==1||!units(d.subject).includes(d.unitId)||d.mode!==(d.subject==='english'?'essay':'solution')||!str(d.prompt,6000)||!integer(d.revision,1e9)||!timestamp(d.updatedAt)||!Array.isArray(d.pages)||d.pages.length<1||d.pages.length>MAX_PAGES)return false;
    let points=0;
    for(const page of d.pages){
      if(!Array.isArray(page)||page.length>3000)return false;
      for(const s of page){
        if(!exact(s,['tool','width','points'])||!['pen','eraser'].includes(s.tool)||!integer(s.width,40)||s.width<1||!Array.isArray(s.points)||!s.points.length)return false;
        points+=s.points.length;if(points>MAX_POINTS)return false;
        if(!s.points.every(p=>Array.isArray(p)&&p.length===3&&integer(p[0],WIDTH)&&integer(p[1],HEIGHT)&&typeof p[2]==='number'&&Number.isFinite(p[2])&&p[2]>=0&&p[2]<=1))return false;
      }
    }
    const r=d.recognition;
    if(r!==null&&(!exact(r,['revision','text','uncertain','confirmed'])||r.revision!==d.revision||!str(r.text,18000)||!strings(r.uncertain,40,400)||typeof r.confirmed!=='boolean'))return false;
    return Array.isArray(d.grades)&&d.grades.length<=10&&d.grades.every(g=>grade(g)&&g.revision<=d.revision&&(!g.needsReview?g.parts.every((p,i)=>p<=(d.mode==='essay'?[25,20,35,20]:[20,30,30,20])[i]):true));
  }
  function create(subject,unitId,prompt=''){return {version:1,subject,unitId,mode:subject==='english'?'essay':'solution',prompt,pages:[[]],revision:0,recognition:null,grades:[],updatedAt:new Date().toISOString()};}
  function count(d){return d.pages.reduce((sum,page)=>sum+page.reduce((n,s)=>n+s.points.length,0),0);}
  function change(d){if(d.revision>=1e9)throw Error('原稿修订次数已达上限，请新建作业。');d.revision++;d.recognition=null;d.updatedAt=new Date().toISOString();}
  function draw(canvas,strokes){
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,WIDTH,HEIGHT);ctx.lineCap='round';ctx.lineJoin='round';
    for(const s of strokes){ctx.globalCompositeOperation=s.tool==='eraser'?'destination-out':'source-over';ctx.strokeStyle=ctx.fillStyle='#182a3a';
      for(let i=0;i<s.points.length;i++){const p=s.points[i],prev=s.points[Math.max(0,i-1)],w=s.width*(s.tool==='eraser'?1:.35+.65*p[2]);ctx.lineWidth=w;ctx.beginPath();if(i===0){ctx.arc(p[0],p[1],w/2,0,Math.PI*2);ctx.fill();}else{ctx.moveTo(prev[0],prev[1]);ctx.lineTo(p[0],p[1]);ctx.stroke();}}
    }ctx.globalCompositeOperation='source-over';
  }
  return {PREFIX,KEY,WIDTH,HEIGHT,MAX_POINTS,MAX_PAGES,units,validate,grade,create,count,change,draw};
});
