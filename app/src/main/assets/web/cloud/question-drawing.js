/* Shared restricted vector format. Model output never becomes arbitrary SVG/HTML. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GrowingQuestionDrawing=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const version='question-svg-v1',ink='#17212b';
  const fields={path:['d'],line:['x1','y1','x2','y2'],polyline:['points'],polygon:['points'],circle:['cx','cy','r'],ellipse:['cx','cy','rx','ry'],rect:['x','y','width','height'],text:['x','y','text']};
  const common=['stroke','fill','strokeWidth','dashed','fontSize','anchor'];
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=10000;
  const text=(s,max)=>typeof s==='string'&&s.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s);
  const color=s=>s==='none'||s==='white'||/^#[0-9a-f]{6}$/i.test(s);
  function normalize(value){
    if(!value||value.version!==version||Object.keys(value).some(k=>!['version','figures','warnings'].includes(k))||!Array.isArray(value.figures)||!value.figures.length||value.figures.length>8||!Array.isArray(value.warnings)||value.warnings.length>12||value.warnings.some(s=>!text(s,300)))return null;
    const figures=[];
    for(const f of value.figures){
      if(!f||Object.keys(f).some(k=>!['width','height','title','elements'].includes(k))||!number(f.width)||!number(f.height)||f.width<80||f.height<80||f.width>2400||f.height>2400||!text(f.title,200)||!f.title.trim()||!Array.isArray(f.elements)||!f.elements.length||f.elements.length>320)return null;
      const elements=[];
      for(const s of f.elements){
        const keys=s&&fields[s.tag];
        if(!Array.isArray(keys)||Object.keys(s).some(k=>!['tag',...keys,...common].includes(k))||keys.some(k=>s[k]===undefined))return null;
        if(s.stroke!==undefined&&!color(s.stroke)||s.fill!==undefined&&!color(s.fill)||s.strokeWidth!==undefined&&(!number(s.strokeWidth)||s.strokeWidth<.5||s.strokeWidth>5)||s.dashed!==undefined&&typeof s.dashed!=='boolean'||s.fontSize!==undefined&&(!number(s.fontSize)||s.fontSize<8||s.fontSize>48)||s.anchor!==undefined&&!['start','middle','end'].includes(s.anchor))return null;
        for(const k of keys){
          if(k==='text'){if(!text(s[k],240))return null;}
          else if(k==='d'){
            if(!text(s.d,12000)||!s.d.trim()||!/^[MmLlHhVvCcSsQqTtAaZz0-9eE+.,\s-]+$/.test(s.d)||!/^\s*[Mm]/.test(s.d))return null;
            if((s.d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[]).some(n=>!Number.isFinite(Number(n))||Math.abs(Number(n))>10000))return null;
          }else if(k==='points'){
            if(!Array.isArray(s.points)||s.points.length<4||s.points.length>800||s.points.length%2||!s.points.every(number))return null;
          }else if(!number(s[k])||['r','rx','ry','width','height'].includes(k)&&s[k]<=0)return null;
        }
        elements.push(Object.fromEntries(['tag',...keys,...common].filter(k=>s[k]!==undefined).map(k=>[k,s[k]])));
      }
      figures.push({width:f.width,height:f.height,title:f.title,elements});
    }
    const normalized={version,figures,warnings:[...value.warnings]};
    return JSON.stringify(normalized).length<=120000?normalized:null;
  }
  const angleLabel=s=>s.tag==='text'&&/^(?:\d+(?:\.\d+)?|[αβγθφxyz])\s*[°º]$/.test(s.text.trim());
  function straightSegments(elements){
    const segments=[];
    const add=(a,b,s)=>{if(s.stroke!=='none')segments.push({a,b,pad:(s.strokeWidth??1.8)/2+1.5});};
    for(const s of elements){
      if(s.tag==='line')add([s.x1,s.y1],[s.x2,s.y2],s);
      else if(s.tag==='polyline'||s.tag==='polygon'){
        for(let i=2;i<s.points.length;i+=2)add(s.points.slice(i-2,i),s.points.slice(i,i+2),s);
        if(s.tag==='polygon')add(s.points.slice(-2),s.points.slice(0,2),s);
      }else if(s.tag==='path'){
        // Curves retain their authored layout; never approximate them as straight edges.
        if(/[CcSsQqTtAa]/.test(s.d))continue;
        const tokens=s.d.match(/[MmLlHhVvZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[];
        let point=[0,0],start=point,command='',i=0;
        while(i<tokens.length){
          if(/^[a-z]$/i.test(tokens[i]))command=tokens[i++];
          const kind=command.toUpperCase(),relative=command!==kind;
          if(kind==='Z'){add(point,start,s);point=start;command='';continue;}
          const count=kind==='H'||kind==='V'?1:kind==='M'||kind==='L'?2:0;
          if(!count||i+count>tokens.length||tokens.slice(i,i+count).some(t=>!Number.isFinite(Number(t))))break;
          const values=tokens.slice(i,i+count).map(Number);i+=count;
          const next=kind==='H'?[values[0]+(relative?point[0]:0),point[1]]:kind==='V'?[point[0],values[0]+(relative?point[1]:0)]:values.map((v,k)=>v+(relative?point[k]:0));
          if(kind==='M'){start=next;command=relative?'l':'L';}else add(point,next,s);
          point=next;
        }
      }
    }
    return segments;
  }
  function labelBox(s){
    const size=s.fontSize??16,width=Array.from(s.text).reduce((w,c)=>w+size*(c.charCodeAt(0)>255?1:.62),0);
    const left=s.x-(s.anchor==='start'?0:s.anchor==='end'?width:width/2);
    return {left,right:left+width,top:s.y-size*.85,bottom:s.y+size*.22};
  }
  function crossesBox(segment,box){
    let low=0,high=1;
    for(const [k,min,max] of [[0,box.left-segment.pad,box.right+segment.pad],[1,box.top-segment.pad,box.bottom+segment.pad]]){
      const delta=segment.b[k]-segment.a[k],origin=segment.a[k];
      if(!delta){if(origin<min||origin>max)return false;continue;}
      const t1=(min-origin)/delta,t2=(max-origin)/delta;
      low=Math.max(low,Math.min(t1,t2));high=Math.min(high,Math.max(t1,t2));
      if(low>high)return false;
    }
    return true;
  }
  function layoutAngles(f){
    if(!f.elements.some(angleLabel))return f.elements;
    const elements=f.elements.map(s=>angleLabel(s)?{...s,fontSize:Math.min(s.fontSize??16,12)}:s),segments=straightSegments(elements);
    for(let index=0;index<elements.length;index++){
      const s=elements[index];if(!angleLabel(s))continue;
      const initial=labelBox(s),cx=(initial.left+initial.right)/2,cy=(initial.top+initial.bottom)/2;
      const others=elements.filter((e,i)=>i!==index&&e.tag==='text').map(labelBox);
      const clear=box=>box.left>=0&&box.top>=0&&box.right<=f.width&&box.bottom<=f.height&&!segments.some(e=>crossesBox(e,box))&&!others.some(b=>box.left<b.right+2&&box.right>b.left-2&&box.top<b.bottom+2&&box.bottom>b.top-2);
      if(clear(initial))continue;
      // Keep the label on the same side of nearby long edges, inside its original angle.
      const sides=segments.filter(e=>Math.hypot(e.b[0]-e.a[0],e.b[1]-e.a[1])>s.fontSize*3).map(e=>{
        const dx=e.b[0]-e.a[0],dy=e.b[1]-e.a[1],length=Math.hypot(dx,dy);
        return {dx,dy,a:e.a,side:(dx*(cy-e.a[1])-dy*(cx-e.a[0]))/length,length};
      }).filter(e=>Math.abs(e.side)>1);
      let best=null,distance=Infinity;
      const radius=Math.ceil(s.fontSize*1.5);
      for(let dx=-radius;dx<=radius;dx+=2)for(let dy=-radius;dy<=radius;dy+=2){
        const d=dx*dx+dy*dy;if(d>=distance||d>radius*radius)continue;
        if(sides.some(e=>e.side*(e.dx*(cy+dy-e.a[1])-e.dy*(cx+dx-e.a[0]))<0))continue;
        const candidate={...s,x:s.x+dx,y:s.y+dy};
        if(clear(labelBox(candidate))){best=candidate;distance=d;}
      }
      if(best)elements[index]=best;
    }
    return elements;
  }
  function renderFigure(f){
    const elements=layoutAngles(f),boxes=elements.filter(s=>s.tag==='text').map(labelBox);
    // Expand the viewport for edge labels without moving any geometric points or labels.
    const left=Math.min(0,...boxes.map(b=>b.left-4)),top=Math.min(0,...boxes.map(b=>b.top-4));
    const width=Math.max(f.width,...boxes.map(b=>b.right+4))-left,height=Math.max(f.height,...boxes.map(b=>b.bottom+4))-top;
    const shapes=elements.map(s=>{
      const isText=s.tag==='text';
      let attrs=` fill="${escape(s.fill??(isText?ink:'none'))}" stroke="${escape(s.stroke??(isText?'none':ink))}"`;
      if(isText)attrs+=` font-family="Arial,Microsoft YaHei,sans-serif" font-size="${s.fontSize??16}" text-anchor="${s.anchor??'middle'}"`;
      else attrs+=` stroke-width="${s.strokeWidth??1.8}" stroke-linecap="round" stroke-linejoin="round"${s.dashed?' stroke-dasharray="6 4"':''}`;
      for(const k of fields[s.tag])if(k!=='text')attrs+=` ${k}="${escape(k==='points'?s.points.join(' '):s[k])}"`;
      return isText?`<text${attrs}>${escape(s.text)}</text>`:`<${s.tag}${attrs}/>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${width} ${height}" role="img" aria-label="${escape(f.title)}"><title>${escape(f.title)}</title>${shapes}</svg>`;
  }
  function render(value){const v=normalize(value);if(!v)throw Error('SVG 题图数据无效');return v.figures.map(renderFigure);}
  return {version,normalize,render};
});
