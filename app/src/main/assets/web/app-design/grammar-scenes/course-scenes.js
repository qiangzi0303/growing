/* Original teaching storyboards using the unchanged MIT stick-scene rig. */
(()=>{
 const {P,mix,seg,E,fig,ln,rr,arrow}=window.RIG,green='#277647',blue='#275d87',muted='#778579';
 const course=window.GrowingEnglishPointCourses.get(new URLSearchParams(location.search).get('unit'));
 const phase=(t,a,b)=>E.soft(seg(t,a,b)),rest=P({hF:[10,-60],hB:[-5,-52]}),point=P({hF:[42,-84],hB:[-5,-52]});
 function text(g,s,x,y,width=320,size=15,color=blue){
  g.save();g.font=`600 ${size}px "Microsoft YaHei",sans-serif`;g.fillStyle=color;g.textAlign='center';
  // Wrap by measured glyph width so English labels and Chinese both fit on phones.
  const lines=[];let line='';for(const char of String(s)){if(g.measureText(line+char).width>width&&line){lines.push(line);line='';}line+=char;}lines.push(line);
  lines.forEach((line,i)=>g.fillText(line,x,y+i*(size+4)));g.restore();
 }
 function box(g,label,x,y,width=96,active=false){g.save();rr(g,x-width/2,y,width,44,7);g.fillStyle=active?'#e4efd9':'#f5f5eb';g.fill();g.strokeStyle=active?green:'#d4dccc';g.lineWidth=1.5;g.stroke();text(g,label,x,y+18,width-10,12,active?green:muted);g.restore();}
 function person(g,name,x,t,scale=.85,flip=1){
  if(!name)return;
  if(/鸟/.test(name)){
   const y=-51+Math.sin(t*2)*5,flap=Math.sin(t*5)*13;
   ln(g,x-28,y-10-flap,x,y,3,blue);ln(g,x,y,x+28,y-10-flap,3,blue);
   g.fillStyle=blue;g.beginPath();g.arc(x+6,y-3,5,0,Math.PI*2);g.fill();
  }else if(/风筝/.test(name)){
   const y=-75+Math.sin(t*2)*4;g.beginPath();g.moveTo(x,y-25);g.lineTo(x+21,y);g.lineTo(x,y+28);g.lineTo(x-21,y);g.closePath();g.fillStyle='#e0b44f';g.fill();ln(g,x,y+28,x-15,y+64,1.5,muted);
  }else if(/电话/.test(name)){
   g.save();g.translate(x,-59);g.rotate(Math.sin(t*10)*.06);rr(g,-16,-29,32,58,6);g.strokeStyle=blue;g.lineWidth=3;g.stroke();ln(g,-8,19,8,19,2,blue);g.restore();
  }else if(/森林|树|叶/.test(name)){
   ln(g,x,-6,x,-77,5,'#917054');g.fillStyle=green;g.beginPath();g.arc(x,-83,29,0,Math.PI*2);g.fill();
  }else if(/湿地|河|水体/.test(name)){
   for(let i=0;i<3;i++){g.beginPath();g.strokeStyle=blue;g.lineWidth=2;for(let j=0;j<=60;j++){const xx=x-30+j,yy=-25-i*16+Math.sin(j*.15+t)*3;if(!j)g.moveTo(xx,yy);else g.lineTo(xx,yy);}g.stroke();}
  }else if(/者|员|老师|学生|同学|朋友|孩子|儿童|父母|妹妹|妈妈|居民|游客|同伴|同桌|主人|她|他们|我们|^我$|^I$|^She$|^Mia$|^Timmy$/.test(name)){
   fig(g,mix(rest,point,phase(t,.4,1.7)*.6),x,0,{s:scale,sx:flip,ink:blue,far:'#a7bac6'});
  }else box(g,name,x,-70,88,true);
  text(g,name,x,25,110,12);
 }
 for(const [id,a] of Object.entries(course.animations||{})){
  window.SCENES[id]={dur:8,width:360,label:a.labels.join('；'),draw(g,S){
   const raw=S.on?S.u*8:0,t=raw<=6.1?raw:6.1*(1-phase(raw,6.1,8)),stage=t<2?0:t<4?1:2,k=phase(t,.3,1.8),names=a.actors||[];
   text(g,a.labels[stage],0,-174,328,15);
   if(a.kind==='compare'||a.kind==='quantity'){
    const values=a.values||[2,4,6],negative=values.some(v=>v<0),max=Math.max(1,...values.map(v=>Math.abs(v))),baseline=negative?-65:-12,height=negative?55:110;
    ln(g,-155,baseline,155,baseline,1.5,muted);
    values.forEach((v,i)=>{const x=(i-(values.length-1)/2)*105,h=v/max*height*phase(t,.2,1.7);g.fillStyle=[blue,green,'#b58a32'][i];g.fillRect(x-19,Math.min(baseline,baseline-h),38,Math.max(1,Math.abs(h)));if(a.kind==='quantity')text(g,String(v),x,v<0?baseline-h+17:baseline-h-8,80,12);text(g,a.items?.[i]||a.labels[i],x,13,98,11);});
   }else if(a.kind==='sequence'){
    a.labels.forEach((label,i)=>{box(g,label,-112+i*112,-139,102,stage>=i);if(i<2)arrow(g,[[-57+i*112,-116],[-55+i*112,-116]],{col:stage>i?green:muted,head:4});});
    person(g,names[0],-90+phase(t,.5,5.5)*180,t,.65);
    ln(g,-115,-4,115,-4,1,muted);
   }else if(a.kind==='transform'){
    const slide=phase(t,.5,1.8);box(g,a.labels[0],-85,-132,144,stage===0);box(g,a.labels[stage?stage:1],85,-132,144,stage>0);
    arrow(g,[[-9,-109],[9,-109]],{col:green,head:5});
    box(g,a.labels[stage],-30+slide*30,-49,176,true);
   }else if(a.kind==='choice'){
    person(g,names[0],0,t,.72);box(g,a.labels[0],-97,-142,150,stage===0);box(g,a.labels[1],97,-142,150,stage===1);
    arrow(g,[[-20,-87],[-60,-94]],{col:stage===0?green:muted,head:5});arrow(g,[[20,-87],[60,-94]],{col:stage===1?green:muted,head:5});
   }else if(a.kind==='reflexive'){
    person(g,names[0],-62,t);box(g,names[1]||'自己',91,-84,100,true);
    // The arrow leaves the subject and returns to that same person.
    const sweep=phase(t,.5,4.7);g.save();g.strokeStyle=green;g.lineWidth=3;g.beginPath();g.arc(-62,-65,51,-Math.PI/2,-Math.PI/2+Math.PI*1.8*sweep);g.stroke();g.restore();
    if(sweep>.95)arrow(g,[[-108,-91],[-100,-106]],{col:green,head:7});
   }else if(a.kind==='weather'){
    person(g,names[0],-119,t,.85);const x=55,y=-93;
    if(stage===0){g.fillStyle='#d9aa36';g.beginPath();g.arc(x,y,25,0,Math.PI*2);g.fill();for(let i=0;i<8;i++){const angle=i*Math.PI/4+t*.08;ln(g,x+Math.cos(angle)*34,y+Math.sin(angle)*34,x+Math.cos(angle)*44,y+Math.sin(angle)*44,2,'#d9aa36');}}
    else if(stage===1){for(let i=0;i<4;i++)ln(g,x-53+Math.sin(t+i)*4,y-22+i*18,x+53+Math.sin(t+i)*4,y-22+i*18,6,'#b7c4c3');}
    else{for(let i=0;i<3;i++){g.fillStyle='#b1c3cd';g.beginPath();g.arc(x-25+i*24,y-25,23,0,Math.PI*2);g.fill();}for(let i=0;i<5;i++){const dy=(t*25+i*15)%45;ln(g,x-43+i*20,y+dy,x-48+i*20,y+dy+10,2,blue);}}
   }else{
    person(g,names[0],-113,t);person(g,names[1],113,t,.85,-1);
    // The moving task card connects actor, action and outcome in order.
    const x=-28+phase(t,.6,3.8)*56;box(g,a.labels[stage],x,-107,140,true);
    arrow(g,[[-70,-38],[-20+phase(t,1,4)*70,-38]],{col:green,head:6});
   }
  }};
 }
})();
