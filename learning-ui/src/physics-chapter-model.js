import {chapterStories,chapterDefaults} from './physics-chapter-stories.js';
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const rad=x=>x*Math.PI/180;
const C={ink:'#f0f1ec',muted:'#a9b9bd',warm:'#edac82',blue:'#80b5ed',green:'#a9c58e',red:'#e99388'};
export function lensImage(u,f){
 if(Math.abs(u-f)<1e-8)return {v:null,m:null,type:'无有限像点'};
 const v=f*u/(u-f),m=-v/u;
 return {v,m,type:v<0?'正立放大虚像':Math.abs(u-2*f)<1e-8?'倒立等大实像':u>2*f?'倒立缩小实像':'倒立放大实像'};
}
export const refractedAngle=(angle,direction)=>Math.asin(Math.sin(rad(angle))*(direction==='out'?4/3:3/4))*180/Math.PI;
const timeline=(p,points)=>{const i=Math.min(3,Math.floor(p*4));return points[i]+(points[i+1]-points[i])*(p*4-i);};
export function chapterState(id,input={},progress=0){
 const story=chapterStories[id],v={...chapterDefaults(id),...input},p=clamp(progress),stage=Math.min(3,Math.floor(p*4)),kind=story.kind;
 const s={p,stage,kind,elements:[],stats:[],status:story.shots[stage][1]};
 const el=(tag,attrs,text)=>s.elements.push({tag,attrs,text});
 const line=(x1,y1,x2,y2,color=C.muted,width=2,dash=false)=>el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':width,...(dash?{'stroke-dasharray':'7 6'}:{})});
 const rect=(x,y,width,height,fill='none',stroke=C.muted)=>el('rect',{x,y,width,height,rx:5,fill,stroke,'stroke-width':2});
 const circle=(cx,cy,r,fill=C.ink,stroke='none')=>el('circle',{cx,cy,r,fill,stroke,'stroke-width':2});
 const text=(x,y,value,color=C.ink,size=18,anchor='start')=>el('text',{x,y,fill:color,'font-size':size,'text-anchor':anchor},String(value));
 const path=(d,color=C.muted,width=2,fill='none',dash=false)=>el('path',{d,stroke:color,'stroke-width':width,fill,...(dash?{'stroke-dasharray':'7 6'}:{})});
 const arrow=(x1,y1,x2,y2,color=C.warm,dash=false)=>{
  line(x1,y1,x2,y2,color,2.5,dash);const a=Math.atan2(y2-y1,x2-x1),l=10;
  line(x2,y2,x2-l*Math.cos(a-.45),y2-l*Math.sin(a-.45),color);line(x2,y2,x2-l*Math.cos(a+.45),y2-l*Math.sin(a+.45),color);
 };
 const trace=(points,q,color=C.warm,dash=false)=>{
  const n=points.length-1,extent=clamp(q)*n;
  for(let i=0;i<n;i++){const t=clamp(extent-i);if(t>0)arrow(...points[i],points[i][0]+(points[i+1][0]-points[i][0])*t,points[i][1]+(points[i+1][1]-points[i][1])*t,color,dash);}
 };
 const graph=(samples,x0=435,y0=300,w=310,h=185,xmax=6,ymax=60)=>{
  arrow(x0,y0,x0+w+10,y0,C.muted);arrow(x0,y0,x0,y0-h-15,C.muted);
  text(x0+w-30,y0+35,'t / s',C.muted,15);text(x0-10,y0-h-25,'s / m',C.muted,15);
  text(x0-15,y0+18,'0',C.muted,14);text(x0+w-20,y0+18,xmax,C.muted,14);text(x0-35,y0-h+5,ymax,C.muted,14);
  path(samples.map(([x,y],i)=>(i?'L':'M')+(x0+x/xmax*w)+' '+(y0-y/ymax*h)).join(' '),C.blue,3);
 };
 const wave=(x,y,width,amplitude,cycles,phase=0,harmonic=0,color=C.blue)=>{
  line(x,y,x+width,y,C.muted,1,true);
  const norm=Math.sqrt(1+harmonic*harmonic);
  path(Array.from({length:181},(_,i)=>{const a=i/180*cycles*2*Math.PI-phase,z=(Math.sin(a)+harmonic*Math.sin(a*(v.tone==='bright'?3:2)))/norm;return (i?'L':'M')+(x+i/180*width)+' '+(y-amplitude*z);}).join(' '),color,2.5);
 };
 const lens=(x,y,h,convex=true)=>path(convex?`M${x} ${y-h}Q${x-24} ${y} ${x} ${y+h}Q${x+24} ${y} ${x} ${y-h}`:`M${x-14} ${y-h}Q${x+10} ${y} ${x-14} ${y+h}L${x+14} ${y+h}Q${x-10} ${y} ${x+14} ${y-h}Z`,C.blue,2,'#223d50');
 const car=(x,y,color=C.warm,w=55)=>{rect(x-w/2,y-25,w,24,color,color);circle(x-w*.3,y+3,6,C.ink);circle(x+w*.3,y+3,6,C.ink);};
 const beamProgress=clamp((p-.12)/.6);

 if(kind==='source'){
  const distance=Number(v.distance),travel=distance/340,time=timeline(p,[0,.35,1,1+travel*.6,1+travel+.15]),active=time<1;
  // Opposite flexure of the two tines, with fixed roots and handle. Visual
  // frequency is slowed to 8 Hz; the audible tone is independently 440 Hz.
  const deflection=active?6*Math.sin(p*24*8*2*Math.PI):0;
  const tine=(left,d,color,width,dash=false)=>el('path',{d,stroke:color,'stroke-width':width,fill:'none',...(dash?{'stroke-dasharray':'3 4','opacity':.3}:{'data-source-part':left?'left-tine':'right-tine'})});
  if(active)for(const edge of [-6,6]){
   tine(true,`M110 200Q110 155 ${110+edge} 100`,C.blue,1,true);
   tine(false,`M160 200Q160 155 ${160-edge} 100`,C.blue,1,true);
  }
  tine(true,`M110 200Q110 155 ${110+deflection} 100`,C.ink,5);
  tine(false,`M160 200Q160 155 ${160-deflection} 100`,C.ink,5);
  el('path',{d:'M110 200Q135 250 160 200M135 225V290',stroke:C.ink,'stroke-width':5,fill:'none','data-source-part':'base-handle'});
  text(60,330,active?'叉股振动（慢放、幅度放大）':'叉股停止振动',active?C.warm:C.muted,16);
  if(stage>=1){const bx=175+(active?38*Math.sin((p-.25)*8*Math.PI)**2:0),by=55+Math.sqrt(125**2-(bx-205)**2);line(205,55,bx,by,C.muted);circle(bx,by,14,C.warm);text(190,35,'小球被弹开',C.warm,16);}
  const fronts=[0,.2,.4,.6,.8,1].filter(t=>time>=t&&time-t<=travel);
  for(const t of fronts){const x=170+(time-t)/travel*470;path(`M${x} 135Q${x+28} 200 ${x} 265`,C.blue,2);}
  circle(680,190,25,'none',C.ink);text(645,245,'接收处');
  s.time=time;s.active=active;s.deflection=deflection;s.fronts=fronts.map(t=>({emitted:t,distance:(time-t)*340}));
  s.receiving=time>=travel&&time<=1+travel;
  text(410,70,'已发出的波继续前进',C.blue,20,'middle');
  s.stats=[['声源',active?'仍在振动':'已停止'],['物理时间',time.toFixed(2)+' s'],['传播延迟',travel.toFixed(2)+' s'],['接收处',s.receiving?'收到声音':time<travel?'尚未到达':'传播已结束']];
 }else if(kind==='medium'){
  const vacuum=v.medium==='vacuum',front=80+640*p;
  rect(65,110,670,180,'#152731');text(90,82,{air:'空气',water:'液体水',solid:'固体',vacuum:'真空'}[v.medium],C.blue,24);
  rect(75,170,35,65,C.warm,C.warm);circle(715,205,15,'none',C.ink);
  if(!vacuum)for(let i=0;i<24;i++){const base=140+i*23,shift=base<front?8*Math.sin((base-front)/25):0;circle(base+shift,190+(i%2)*30,5,C.blue);if(stage>=1&&i===10){line(base,155,base,255,C.warm,1,true);arrow(base-18,250,base+18,250);}}
  if(stage>=2&&!vacuum)arrow(130,325,Math.min(front,710),325,C.blue);
  text(410,365,vacuum?'声源可以振动，但没有传声介质':'粒子在附近振动，扰动向前传播',C.ink,20,'middle');
  s.transmits=!vacuum;s.stats=[['介质',v.medium==='vacuum'?'无':'有'],['声源','继续振动'],['传播',vacuum?'不能传声':'可以传声'],['粒子运动','原位置附近往复']];
 }else if(kind==='echo'){
  const speed=v.medium==='water'?1500:340,d=Number(v.distance),t=timeline(p,[0,d/speed,d/speed,1.5*d/speed,2*d/speed]),travel=speed*t,x=travel<=d?travel:2*d-travel;
  rect(680,75,18,230,'#52656d');circle(120,210,24,C.warm);text(80,260,'发声 / 接收');text(643,335,'障碍物');
  line(145,210,680,210,C.muted,1,true);circle(145+535*x/d,210,11,C.blue);
  if(stage>=1)arrow(145,145,680,145,C.warm);if(stage>=2)arrow(680,285,145,285,C.blue);
  text(390,125,'去程 d',C.warm,20);if(stage>=2)text(390,320,'回程 d',C.blue,20);
  if(stage===3)text(410,60,'d = vt ÷ 2',C.ink,28,'middle');
  s.time=t;s.travel=travel;s.distance=d;s.stats=[['单程距离',d+' m'],['声速',speed+' m/s'],['经过时间',t.toFixed(3)+' s'],['总路程',travel.toFixed(1)+' m']];
 }else if(['pitch','loudness','timbre'].includes(kind)){
  const frequency=kind==='pitch'?Number(v.frequency):200,cycles=frequency*.01,amplitude=kind==='loudness'?Number(v.amplitude)*13:32;
  text(75,55,'同样的10 ms时间窗口',C.ink,22);text(75,110,'对照',C.muted,16);
  wave(100,155,620,26,2,p*10,0,C.muted);
  if(stage>=1){text(75,225,kind==='pitch'?'改变频率':kind==='loudness'?'改变振幅 / 距离':'改变波形轮廓',C.blue,16);wave(100,290,620,amplitude,cycles,p*10,kind==='timbre'?(v.tone==='pure'?0:.45):0);}
  if(stage>=2&&kind==='loudness'){line(750,290-amplitude,750,290+amplitude,C.warm,3);text(730,365,'振幅',C.warm,15);}
  s.frequency=frequency;s.amplitude=amplitude;s.received=kind==='loudness'?Number(v.amplitude)/Number(v.distance):1;
  s.stats=kind==='pitch'?[['频率',frequency+' Hz'],['10 ms内周期数',(frequency*.01).toFixed(1)],['振幅','保持相同'],['音调',frequency>200?'比对照高':frequency===200?'与对照相同':'比对照低']]:kind==='loudness'?[['频率','保持200 Hz'],['源振幅',v.amplitude+'（相对值）'],['接收距离',v.distance+' m'],['接收幅度',s.received.toFixed(2)+'（示意）']]:[['基频','200 Hz'],['整体周期','5 ms'],['波形',v.tone==='pure'?'正弦':v.tone==='warm'?'含二次谐波':'含三次谐波'],['比较对象','声音的特色']];
  if(kind==='loudness'&&stage>=2){text(410,385,'接收幅度 = 源振幅 ÷ 距离（理想示意）',C.warm,17,'middle');}
 }else if(kind==='noise'){
  const attenuation=['source','barrier','ear'].includes(v.measure)?.3:1;
  rect(80,160,70,90,C.warm);text(78,290,'声源');circle(690,200,26,'none',C.ink);text(665,290,'接收处');
  for(let i=0;i<12;i++){const x=180+i*40;let amp=35;if(v.measure==='source'||v.measure==='barrier'&&x>400||v.measure==='ear'&&x>630)amp*=attenuation;path(`M${x} ${200-amp}Q${x+15} 200 ${x} ${200+amp}`,C.blue,2);}
  if(v.measure==='source'){rect(65,145,100,120,'none',C.green);text(75,125,'源头消声',C.green);}
  if(v.measure==='barrier'){rect(395,110,15,175,'#466079',C.blue);text(355,95,'传播途中',C.blue);}
  if(v.measure==='ear'){path('M660 185Q690 145 720 185',C.green,8);text(655,145,'耳罩',C.green);}
  if(v.measure==='meter'){rect(440,275,80,50,'#223d50');text(450,308,'监测',C.ink,18);}
  const positions=[115,115,405,690];circle(positions[stage],200,stage===0?55:65,'none',C.warm);
  text(410,365,v.measure==='meter'?'监测仪不会阻断声波':'根据措施所在位置，判断降噪环节',C.ink,21,'middle');
  s.attenuation=attenuation;s.stats=[['当前措施',story.controls[0].options.find(o=>o[0]===v.measure)[1]],['作用环节',{none:'无',source:'声源',barrier:'传播途中',ear:'接收处',meter:'只监测'}[v.measure]],['接收趋势',attenuation<1?'减弱（示意）':'未减弱'],['环境判断','是否造成干扰']];
 }else if(kind==='frequency'){
  const frequency=Number(v.frequency),x=n=>90+Math.log10(n)/5*640;
  rect(x(1),150,x(20)-x(1),90,'#334047');rect(x(20),150,x(20000)-x(20),90,'#244d49');rect(x(20000),150,x(100000)-x(20000),90,'#514032');
  text(95,280,'次声',C.muted);text(350,280,'通常可听范围',C.green,22,'middle');text(660,280,'超声',C.warm);
  for(const n of [1,20,20000,100000]){line(x(n),145,x(n),245,C.muted);text(x(n),320,n+' Hz',C.muted,14,'middle');}
  if(stage>=1){arrow(x(frequency),85,x(frequency),145,C.warm);text(x(frequency),65,frequency+' Hz',C.warm,22,'middle');}
  s.category=frequency<20?'次声':frequency>20000?'超声':'通常可听范围';s.stats=[['待判断频率',frequency+' Hz'],['分类',s.category],['依据','频率'],['声音播放','仅图示，不发声']];
  if(stage===1)rect(x(1)-3,145,x(20)-x(1)+6,100,'none',C.warm);
  if(stage===2)rect(x(20000)-3,145,x(100000)-x(20000)+6,100,'none',C.warm);
  if(stage===3)text(410,375,frequency+' Hz → '+s.category,C.green,24,'middle');
 }else if(kind==='spectrum'){
  path('M350 90L290 285H430Z',C.blue,2,'#223d50');text(310,330,'三棱镜');
  trace([[75,210],[325,175]],Math.min(1,p*4),v.light==='white'?C.ink:'#ed7777');
  const colors=v.light==='white'?['#ef7777','#efaa64','#e8d075','#91c58c','#80b5ed','#9896dc','#c48ed7']:['#ef7777'];
  if(stage>=1)colors.forEach((color,i)=>trace([[325,175],[390,190],[700,190+i*19]],clamp((p-.25)/.45),color));
  if(stage>=2){rect(708,170,10,160,'#cad0c9');text(670,365,'光屏',C.ink);}
  s.stats=[['入射光',v.light==='white'?'白光':'红色单色光'],['光的组成',v.light==='white'?'复色光':'单色光'],['色散结果',v.light==='white'?'形成色带':'不分成七色'],['示意','颜色间距非实测']];
 }else if(kind==='rgb'){
  const vals=[Number(v.red),Number(v.green),Number(v.blue)],colors=['#ff5555','#55dd88','#6699ff'];
  vals.forEach((value,i)=>{const y=95+i*105;circle(100,y,25,`rgb(${i===0?value:0},${i===1?value:0},${i===2?value:0})`,colors[i]);text(45,y+45,['红光','绿光','蓝光'][i],colors[i]);if(stage>=i||stage===3)trace([[130,y],[420,200]],clamp((p-i*.15)*3),colors[i]);});
  const active=stage<2?[vals[0],stage>=1?vals[1]:0,0]:vals;
  rect(435,110,245,180,`rgb(${active.join(',')})`,C.ink);text(560,330,stage<2?'逐束加入':'三通道混合',C.ink,21,'middle');
  s.color=`rgb(${vals.join(',')})`;s.stats=[['红通道',vals[0]],['绿通道',vals[1]],['蓝通道',vals[2]],['混合方式','色光相加']];
 }else if(kind==='pinhole'){
  const k=4,x=350,ox=x-Number(v.u)*k,sx=x+Number(v.screen)*k,h=45,ih=h*Number(v.screen)/Number(v.u);
  line(ox,200-h,ox,200+h,C.ink,5);circle(ox,200-h,6,C.warm);circle(ox,200+h,6,C.blue);
  line(x,65,x,195,C.muted,6);line(x,205,x,345,C.muted,6);line(sx,60,sx,350,C.muted,5);
  trace([[ox,200-h],[x,200],[sx,200+ih]],beamProgress,C.warm);trace([[ox,200+h],[x,200],[sx,200-ih]],beamProgress,C.blue);
  if(stage>=2){line(sx,200-ih,sx,200+ih,C.ink,5);circle(sx,200+ih,6,C.warm);circle(sx,200-ih,6,C.blue);}
  text(ox,370,'物体',C.ink,18,'middle');text(x,370,'小孔',C.ink,18,'middle');text(sx,370,'光屏',C.ink,18,'middle');
  s.m=-Number(v.screen)/Number(v.u);s.stats=[['物距',v.u+' cm'],['屏距',v.screen+' cm'],['像高 / 物高',Math.abs(s.m).toFixed(2)],['像的性质','倒立实像']];
 }else if(kind==='mirror'||kind==='mirrorLab'){
  const d=Number(v.distance),x=410,k=2.5,ox=x-d*k,ix=x+d*k;
  line(x,70,x,330,C.blue,5);arrow(ox,280,ox,170,C.warm);text(ox,315,'物',C.warm,19,'middle');
  if(stage>=1){line(ox,230,ix,230,C.muted,1,true);arrow(ix,280,ix,170,C.blue,true);text(ix,315,'虚像',C.blue,19,'middle');text((ox+x)/2,255,d+' cm',C.warm,16,'middle');text((x+ix)/2,255,d+' cm',C.blue,16,'middle');}
  if(kind==='mirrorLab'){
   const substitute=Number(v.substitute),bx=x+substitute*k;arrow(bx,285,bx,175,C.green);text(bx,350,'替代棋子',C.green,16,'middle');
   s.aligned=Math.abs(substitute-d)<.01;s.stats=[['物距',d+' cm'],['像距',d+' cm'],['替代物距离',substitute+' cm'],['是否重合',s.aligned?'重合':'未重合']];
  }else{
   if(stage>=2)for(const yy of [120,200]){trace([[ox,170],[x,yy],[150,yy+(yy-170)*260/(x-ox)]],1,C.warm);line(x,yy,ix,170,C.blue,1,true);}
   s.stats=[['物距',d+' cm'],['像距',d+' cm'],['物像间距',2*d+' cm'],['像的性质','正立、等大、虚像']];
  }
  s.imageDistance=d;text(410,42,'镜面两侧的对应关系',C.ink,22,'middle');
  if(kind==='mirrorLab'&&stage>=2){circle(x+Number(v.substitute)*k,225,62,'none',s.aligned?C.green:C.red);text(410,380,s.aligned?'替代物与虚像重合':'替代物尚未到达虚像位置',s.aligned?C.green:C.red,19,'middle');}
  if(stage===3){line(ox,95,ix,95,C.green,2);text(410,80,'物像间距 = 2 × '+d+' = '+2*d+' cm',C.green,20,'middle');}
 }else if(kind==='reflection'||kind==='refraction'){
  const a=Number(v.angle),refraction=kind==='refraction',b=refraction?refractedAngle(a,v.direction):a,x=410,y=195,L=150;
  if(refraction){rect(60,y,700,155,v.direction==='out'?'#1b242a':'#173b50','none');text(75,85,v.direction==='out'?'水':'空气',C.blue);text(75,325,v.direction==='out'?'空气':'水',C.blue);}
  line(60,y,760,y,C.blue,3);
  trace([[x-L*Math.sin(rad(a)),y-L*Math.cos(rad(a))],[x,y]],clamp(p*4),C.warm);
  if(stage>=1){line(x,40,x,355,C.muted,1,true);text(x+15,60,'法线',C.muted,17);text(x-100,y-65,'i = '+a+'°',C.warm);}
  if(stage>=2){const ex=x+L*Math.sin(rad(b)),ey=y+(refraction?1:-1)*L*Math.cos(rad(b));trace([[x,y],[ex,ey]],clamp((p-.5)*4),C.blue);text(x+65,refraction?y+70:y-65,(refraction?'r':'反射角')+' = '+b.toFixed(1)+'°',C.blue,19);}
  s.incidence=a;s.outputAngle=b;s.stats=[['入射角',a+'°'],[refraction?'折射角':'反射角',b.toFixed(1)+'°'],['与界面的夹角',(90-a)+'°'],['测角基准','法线']];
 }else if(kind==='diffuse'){
  const slopes=v.surface==='rough'?[-.32,.17,-.12,.3,-.25]:[0,0,0,0,0];s.rays=[];
  for(let i=0;i<5;i++){const x=150+i*125,y=245,slope=slopes[i],nx=slope,ny=-1,norm=Math.hypot(nx,ny),n=[nx/norm,ny/norm],incoming=[.4,Math.sqrt(.84)],dot=incoming[0]*n[0]+incoming[1]*n[1],out=[incoming[0]-2*dot*n[0],incoming[1]-2*dot*n[1]];
   line(x-55,y-55*slope,x+55,y+55*slope,C.muted,5);
   trace([[x-incoming[0]*150,y-incoming[1]*150],[x,y]],clamp(p*4),C.warm);
   if(stage>=1)line(x-n[0]*30,y-n[1]*30,x+n[0]*95,y+n[1]*95,C.muted,1,true);
   if(stage>=2)trace([[x,y],[x+out[0]*155,y+out[1]*155]],clamp((p-.5)*4),C.blue);
   s.rays.push({incoming,normal:n,outgoing:out});
  }
  text(410,340,v.surface==='rough'?'各处法线不同 → 反射方向不同':'法线方向相同 → 反射光仍平行',C.ink,23,'middle');
  s.stats=[['表面',v.surface==='rough'?'粗糙':'光滑'],['入射光','平行'],['反射方向',v.surface==='rough'?'分散':'平行'],['每一处','均遵守反射定律']];
 }else if(kind==='shallow'){
  const depth=Number(v.depth),y=150,k=45,dy=depth*k,apparent=depth*.75,ay=150+apparent*k;
  rect(70,y,680,220,'#173b50','none');line(70,y,750,y,C.blue,3);circle(380,y+dy,8,C.warm);text(320,y+dy+28,'真实物体',C.warm);
  for(const dx of [30,60]){const ix=380+dx,slope=dx/(dy*.75),endX=ix+100*slope;trace([[380,y+dy],[ix,y],[endX,50]],beamProgress,C.warm);if(stage>=2)line(ix,y,380,ay,C.blue,1,true);}
  if(stage>=2){circle(380,ay,7,'none',C.blue);text(280,ay-12,'较浅的虚像',C.blue);}
  text(80,90,'空气',C.ink);text(80,190,'水',C.blue);s.depth=depth;s.apparent=apparent;
  s.stats=[['真实水深',depth.toFixed(1)+' m'],['近轴视深',apparent.toFixed(2)+' m'],['成像','较浅的虚像'],['光路方向','水底 → 眼睛']];
 }else if(['lens','focus'].includes(kind)){
  const focal=Number(v.f),convex=kind==='focus'||v.lens==='convex',x=410,y=210,k=8,fx=x+(convex?1:-1)*focal*k;
  line(60,y,760,y,C.muted,1,true);lens(x,y,105,convex);
  for(const h of [-65,0,65]){trace([[90,y+h],[x,y+h]],clamp(p*4),C.warm);if(stage>=1){const endY=y+h+(convex?-1:1)*h*(740-x)/(focal*k);trace([[x,y+h],[740,endY]],clamp((p-.25)*2),C.blue);if(!convex&&stage>=2)line(x,y+h,fx,y,C.blue,1,true);}}
  if(stage>=2)for(const xx of [x-focal*k,x+focal*k]){circle(xx,y,5,C.green);text(xx,y+30,'F',C.green,20,'middle');}
  text(x+12,y+25,'O',C.ink);if(stage===3){line(x,345,x+focal*k,345,C.green);text(x+focal*k/2,370,'f = '+focal+' cm',C.green,19,'middle');}
  s.f=focal;s.convex=convex;s.stats=[['透镜',convex?'凸透镜':'凹透镜'],['平行光作用',convex?'会聚':'发散'],['焦距大小',focal+' cm'],['两侧焦点间距',2*focal+' cm']];
 }else if(['imaging','lensLab','applications'].includes(kind)){
  const focal=kind==='imaging'?Number(v.f):12,object=kind==='applications'?{camera:36,projector:18,magnifier:8}[v.use]:Number(v.u),img=lensImage(object,focal);
  const scale=Math.min(7,300/Math.max(object,Math.abs(img.v||0),kind==='lensLab'?Number(v.screen):0,2*focal),125/Math.max(5,Math.abs(5*(img.m||0))));
  const x=410,y=210,h=5*scale,ox=x-object*scale,ix=img.v===null?null:x+img.v*scale,iy=img.m===null?null:y-img.m*h;
  line(45,y,775,y,C.muted,1,true);lens(x,y,115);arrow(ox,y,ox,y-h,C.warm);
  for(const d of [-2,-1,1,2]){circle(x+d*focal*scale,y,3,C.green);text(x+d*focal*scale,y+25,Math.abs(d)===2?'2F':'F',C.green,14,'middle');}
  text(ox,355,'物',C.warm,18,'middle');text(x,355,'透镜',C.blue,18,'middle');
  const endX=img.v!==null&&img.v>0?ix:750,endTop=y-h+(endX-x)*h/(focal*scale),endCenter=y+(endX-x)*h/(object*scale);
  if(stage>=1){trace([[ox,y-h],[x,y-h],[endX,endTop]],clamp((p-.25)*4),C.warm);trace([[ox,y-h],[x,y],[endX,endCenter]],clamp((p-.25)*4),C.blue);}
  if(stage>=2&&img.v!==null){if(img.v<0){line(x,y-h,ix,iy,C.warm,1,true);line(x,y,ix,iy,C.blue,1,true);}arrow(ix,y,ix,iy,C.green,img.v<0);text(ix,img.m>0?iy-16:iy+25,img.v<0?'虚像':'实像',C.green,17,'middle');}
  if(img.v===null&&stage>=2)text(410,70,'出射光平行：无有限像点',C.green,23,'middle');
  if(kind==='lensLab'){
   const screen=Number(v.screen),sx=x+screen*scale,hit1=y-h+screen*scale*h/(focal*scale),hit2=y+screen*scale*h/(object*scale);
   line(sx,80,sx,335,C.ink,4);if(stage>=2){circle(sx,hit1,5,C.warm);circle(sx,hit2,5,C.blue);}s.screenGap=Math.abs(hit1-hit2)/scale;s.aligned=Math.abs(screen-img.v)<.15;
   s.stats=[['物距',object+' cm'],['计算像距',img.v.toFixed(2)+' cm'],['屏距',screen+' cm'],['光屏状态',s.aligned?'对准像平面':'未对准，需移动']];
  }else s.stats=[['物距',object+' cm'],['焦距',focal+' cm'],['像距',img.v===null?'无有限值':Math.abs(img.v).toFixed(2)+' cm'+(img.v<0?'（物侧）':'')],['像的性质',img.type]];
  s.u=object;s.f=focal;s.image=img;
  if(stage===3)text(410,395,img.type+' · '+(object<focal?'u < f':object===focal?'u = f':object<2*focal?'f < u < 2f':object===2*focal?'u = 2f':'u > 2f'),C.green,20,'middle');
 }else if(kind==='eye'){
  const base=v.eye==='near'?1/145:1/235,spacing=60,needed=b=>(1-b*185)/(185+spacing*(1-b*185)),correction=stage<2||v.correction==='none'?0:v.correction==='concave'?needed(1/145):needed(1/235),relativeHeight=1-spacing*correction,focus=relativeHeight/(correction+base*relativeHeight),x=340,retina=525;
  path('M340 100C620 25 620 375 340 300',C.muted,2);lens(x,200,90);line(retina,100,retina,300,C.green,3);text(retina-30,335,'视网膜',C.green,17);
  if(stage>=2&&v.correction!=='none'){lens(x-spacing,200,85,v.correction==='convex');text(200,80,v.correction==='convex'?'凸透镜':'凹透镜',C.blue);}
  for(const h of [-55,55]){const eyeH=h*relativeHeight;trace([[75,200+h],[x-spacing,200+h],[x,200+eyeH]],clamp(p*4),C.warm);if(stage>=1)trace([[x,200+eyeH],[740,200+eyeH-eyeH*(740-x)/focus]],clamp((p-.25)*2),C.blue);}
  if(stage>=1&&x+focus<=750&&focus>0)circle(x+focus,200,7,C.warm);
  s.focus=focus;s.corrected=Math.abs(focus-185)<.01;s.stats=[['观察条件',v.eye==='near'?'近视看远处':'远视看近处'],['所加镜片',{none:'无',concave:'凹透镜',convex:'凸透镜'}[v.correction]],['像的位置',s.corrected?'视网膜上':focus<185?'视网膜前':'视网膜后'],['视网膜位置','固定']];
 }else if(kind==='instruments'){
  const telescope=v.instrument==='telescope',fo=telescope?24:8,fe=telescope?8:12,object=telescope?null:10,mid=telescope?fo:lensImage(object,fo).v,separation=mid+fe,k=8,x=210,y=215,ex=x+separation*k;
  line(50,y,775,y,C.muted,1,true);lens(x,y,95);lens(ex,y,75);text(x,355,'物镜',C.blue,20,'middle');text(ex,355,'目镜',C.blue,20,'middle');
  const imageHeight=telescope?-12:-40;
  for(const height of [-45,35]){
   const incoming=telescope?imageHeight/(fo*k):(height-10)/(object*k);
   trace([[telescope?60:x-object*k,telescope?y+height-incoming*(x-60):y+10],[x,y+height]],clamp(p*4),C.warm);
   const slope=(imageHeight-height)/(mid*k),eyeH=height+slope*separation*k,after=slope-eyeH/(fe*k);
   if(stage>=1)trace([[x,y+height],[x+mid*k,y+imageHeight],[ex,y+eyeH]],clamp((p-.25)*4),C.blue);
   if(stage>=2)trace([[ex,y+eyeH],[770,y+eyeH+after*(770-ex)]],clamp((p-.5)*4),C.green);
  }
  if(stage>=1){arrow(x+mid*k,y,x+mid*k,y+imageHeight,C.warm);text(x+mid*k,310,'中间实像',C.warm,17,'middle');}
  s.stats=[['仪器',telescope?'开普勒望远镜':'显微镜'],['物镜作用',telescope?'形成缩小实像':'形成放大实像'],['目镜作用','增大观察视角'],['物镜焦距',telescope?'相对较长':'相对较短']];
 }else if(kind==='invisible'){
  const colors=['#e87878','#eaaa68','#e3cf75','#95c18e','#7eafe0','#a397d4','#c793c9'];colors.forEach((color,i)=>rect(220+i*55,150,55,80,color,color));
  rect(65,150,140,80,'none',C.warm);rect(620,150,135,80,'none',C.blue);text(100,130,'红外',C.warm,22);text(640,130,'紫外',C.blue,22);text(410,270,'可见光',C.ink,22,'middle');
  const ir=v.detector==='ir',x=ir?135:685;line(x,240,x,310,C.muted,2,true);
  if(stage>=1){rect(x-45,310,90,42,'#253c46');text(x,337,ir?'温度探头':'荧光材料',C.ink,16,'middle');}
  if(stage>=2){circle(x,195,20,ir?C.warm:'#a9c58e');text(410,370,ir?'探头响应：说明红光外侧也有能量':'材料发出可见荧光，不是直接看见紫外线',C.ink,19,'middle');}
  if(stage===3){arrow(x,270,410,300,C.green);text(410,330,ir?'热成像：接收红外辐射':'荧光与消毒：利用紫外作用',C.green,19,'middle');}
  s.stats=[['探测区域',ir?'红外':'紫外'],['现象',ir?'热效应':'激发荧光'],['肉眼直接观察','不可见'],['响应数值','仅示意，不作测量']];
 }else if(kind==='length'){
  const start=Number(v.start),length=Number(v.length),end=start+length,x=n=>65+n*80;
  rect(65,220,680,85,'#d9caa7',C.muted);
  for(let i=0;i<=80;i++){const px=x(i/10);line(px,220,px,220+(i%10===0?35:i%5===0?25:15),'#20353d',1);if(i%10===0)text(px,280,i/10,'#20353d',17,'middle');}
  rect(x(start),160,length*80,35,C.blue);text(690,285,'cm','#20353d',17);
  if(stage>=1){line(x(start),130,x(start),305,C.warm,2,true);text(x(start),110,start.toFixed(2),C.warm,20,'middle');}
  if(stage>=2){line(x(end),130,x(end),305,C.green,2,true);text(x(end),110,end.toFixed(2),C.green,20,'middle');}
  if(stage===3)text(410,355,`${end.toFixed(2)} − ${start.toFixed(2)} = ${length.toFixed(2)} cm`,C.ink,27,'middle');
  s.start=start;s.end=end;s.length=length;s.stats=[['初读数',start.toFixed(2)+' cm'],['末读数',end.toFixed(2)+' cm'],['物长',length.toFixed(2)+' cm'],['分度值','1 mm，估读到0.01 cm']];
 }else if(kind==='error'){
  const count=Number(v.count),bias=Number(v.bias),base=[3.22,3.26,3.24,3.25,3.23,3.24],samples=base.slice(0,count).map(x=>x+bias),mean=samples.reduce((a,b)=>a+b,0)/count,x=n=>90+(n-3.15)/.5*620;
  line(90,305,755,305,C.muted);for(let i=0;i<(stage===0?1:count);i++){circle(x(samples[i]),95+i*30,7,C.blue);text(x(samples[i])+16,101+i*30,samples[i].toFixed(2)+' cm',C.blue,16);}
  if(stage>=2){line(x(mean),65,x(mean),305,C.warm,3);text(x(mean),340,'平均 '+mean.toFixed(2)+' cm',C.warm,20,'middle');}
  if(stage===3){line(x(3.24),65,x(3.24),305,C.green,2,true);text(80,385,'标称参考3.24 cm；共同偏差不会被平均消除',C.green,19);}
  s.samples=samples;s.mean=mean;s.stats=[['次数',count],['平均值',mean.toFixed(2)+' cm'],['共同偏差',bias.toFixed(2)+' cm'],['结论','误差只能减小，不能消除']];
 }else if(kind==='time'){
  const count=Number(v.count),period=Number(v.period),time=p*count*period,phase=time/period*2*Math.PI,theta=.38*Math.cos(phase),cx=250+160*Math.sin(theta),cy=85+160*Math.cos(theta);
  circle(250,85,6,C.muted);line(250,85,cx,cy,C.ink,3);circle(cx,cy,19,C.warm);line(250,80,250,285,C.muted,1,true);
  if(stage>=1){path('M190 235Q250 275 310 235',C.blue,2);text(180,320,'完整来回才算一次',C.ink,19);}
  text(555,155,time.toFixed(2)+' s',C.warm,40,'middle');text(555,220,'完成 '+Math.floor(time/period+1e-7)+' 个来回',C.ink,22,'middle');
  if(stage===3){text(555,270,'完成目标次数后：',C.green,18,'middle');text(555,310,`${(count*period).toFixed(1)} ÷ ${count} = ${period.toFixed(2)} s`,C.green,23,'middle');}
  s.time=time;s.period=period;s.stats=[['累计时间',time.toFixed(2)+' s'],['完整次数',Math.floor(time/period+1e-7)],['目标次数',count],['平均周期',period.toFixed(2)+' s']];
 }else if(kind==='speed'||kind==='uniform'){
  const speed=Number(v.speed),other=kind==='speed'?Number(v.other):0,duration=kind==='speed'?5:6,time=p*duration,stopped=kind==='uniform'&&v.motion==='stop';
  const distance=t=>speed*(stopped?(t<=2?t:t<=4?2:t-2):t),d=distance(time),d2=other*time,k=5;
  const lane=(y,velocity,dist)=>{line(55,y+18,385,y+18,C.muted,2);if(stage>=1)for(let t=0;t<=Math.floor(time);t++)circle(65+(velocity===speed?distance(t):velocity*t)*k,y,4,C.muted);car(65+dist*k,y,velocity===speed?C.warm:C.blue);};
  lane(155,speed,d);if(kind==='speed')lane(270,other,d2);
  if(stage>=2){const samples=Array.from({length:61},(_,i)=>{const t=time*i/60;return [t,distance(t)];});graph(samples,435,300,310,180,duration,60);}
  text(60,80,kind==='speed'?'同一时间比较两车路程':'直线路线与等时位置',C.ink,20);
  s.time=time;s.distance=d;s.otherDistance=d2;s.stats=kind==='speed'?[['经过时间',time.toFixed(2)+' s'],['甲路程',d.toFixed(2)+' m'],['乙路程',d2.toFixed(2)+' m'],['甲速度换算',(speed*3.6).toFixed(1)+' km/h']]:[['经过时间',time.toFixed(2)+' s'],['累计路程',d.toFixed(2)+' m'],['当前状态',stopped&&time>=2&&time<4?'停留':'运动'],['图像横轴','时间，不是位置']];
 }else if(kind==='average'){
  const bridge=Number(v.bridge),train=Number(v.train),speed=Number(v.speed),wait=Number(v.wait),total=bridge+train,duration=total/speed+wait,t=p*duration,stopAt=bridge/(2*speed),moving=t<=stopAt?t:t<=stopAt+wait?stopAt:t-wait,head=Math.min(total,moving*speed),k=620/(total+train),x0=90+train*k;
  rect(x0,245,bridge*k,35,'#39565d');text(x0+bridge*k/2,325,'桥长 '+bridge+' m',C.blue,20,'middle');
  const hx=x0+head*k;rect(hx-train*k,185,train*k,45,C.warm);circle(hx-train*k*.8,237,6,C.ink);circle(hx-train*k*.2,237,6,C.ink);
  line(x0,120,x0,290,C.muted,1,true);line(x0+bridge*k,120,x0+bridge*k,290,C.muted,1,true);
  if(stage>=1){arrow(x0,100,hx,100,C.warm);text(410,75,'车头走过的路程 '+head.toFixed(1)+' m',C.warm,21,'middle');}
  text(410,370,head>=total?'车尾已离桥':head>=bridge?'车头已离桥，车尾还未离桥':t>stopAt&&t<=stopAt+wait?'计时继续：列车正在停留':'列车尚未完全过桥',C.ink,21,'middle');
  s.time=t;s.head=head;s.totalDistance=total;s.duration=duration;s.average=total/duration;s.stats=[['完全过桥路程',total+' m'],['全程时间',duration.toFixed(2)+' s'],['行驶速度',speed+' m/s'],['全程平均速度',s.average.toFixed(2)+' m/s']];
 }else if(kind==='reference'){
  const speed=Number(v.speed),time=p*5,offset=speed*time,k=4,frame=v.frame==='train'?offset:0,trainX=150+(offset-frame)*k;
  line(50,290,770,290,C.muted,3);for(let i=0;i<6;i++){const x=90+i*130-frame*k;line(x,230,x,290,C.green,5);circle(x,217,18,C.green);}
  rect(trainX,145,155,100,'#284552',C.blue);circle(trainX+75,170,12,C.warm);line(trainX+75,182,trainX+75,215,C.warm,4);circle(trainX+30,255,12,C.ink);circle(trainX+125,255,12,C.ink);
  if(stage>=1)text(410,70,'当前参照物：'+(v.frame==='train'?'车厢':'地面'),C.ink,25,'middle');
  if(stage>=2)arrow(160,345,v.frame==='train'?75:160+offset*k,345,C.warm);
  s.relativePosition=offset-frame;s.time=time;s.stats=[['参照物',v.frame==='train'?'车厢':'地面'],['乘客相对位移',(offset-frame).toFixed(1)+' m'],['乘客状态',v.frame==='train'?'相对静止':'相对运动'],['经过时间',time.toFixed(1)+' s']];
 }
 return s;
}
