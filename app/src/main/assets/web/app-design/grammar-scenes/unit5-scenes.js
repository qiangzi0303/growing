/* Original Unit 5 storyboards. Runtime remains the upstream MIT version. */
(()=>{
 const {P,mix,seg,E,fig,breathe,ln,rr,inkFill,arrow}=window.RIG;
 const green='#277647',blue='#275d87',red='#b34b43',muted='#738175';
 const rest=()=>P({hF:[12,-60],hB:[-4,-52]});
 const phase=(t,start,end)=>E.soft(seg(t,start,end));
 function label(g,s,x,y,col=blue,size=14){g.save();g.fillStyle=col;g.font=`600 ${size}px "Microsoft YaHei",sans-serif`;g.textAlign='center';g.fillText(s,x,y);g.restore();}
 function oval(g,x,y,rx,ry,col){g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}
 function panda(g,x,y,scale=1){
  g.save();g.translate(x,y);g.scale(scale,scale);
  oval(g,0,-31,28,34,'#34443b');oval(g,0,-35,23,25,'#fff');
  oval(g,-18,-77,10,10,'#34443b');oval(g,18,-77,10,10,'#34443b');
  oval(g,0,-62,29,25,'#34443b');oval(g,0,-63,27,23,'#fff');
  oval(g,-12,-65,8,10,'#34443b');oval(g,12,-65,8,10,'#34443b');
  oval(g,-11,-67,2,2,'#fff');oval(g,11,-67,2,2,'#fff');oval(g,0,-54,4,3,'#34443b');
  oval(g,-20,-4,12,6,'#34443b');oval(g,20,-4,12,6,'#34443b');g.restore();
 }
 function bamboo(g,x,alpha=1){g.save();g.globalAlpha=alpha;
  ln(g,x,0,x,-101,4,green);
  for(const y of [-26,-49,-73]){ln(g,x-4,y,x+4,y,2,'#89ae70');ln(g,x,y-6,x+17,y-17,3,'#7da267');ln(g,x,y-12,x-12,y-24,3,'#7da267');}g.restore();
 }
 function keeper(g,S,x=-120,amount=0){const pose=mix(rest(),P({hF:[35,-84],hB:[-4,-52]}),amount);fig(g,breathe(pose,S.t),x,0,{ink:blue,far:'#a7bac6'});}
 function caption(g,a,b,col=green){label(g,a,-70,-173,blue);arrow(g,[[-10,-179],[25,-179]],{col:muted,head:5});label(g,b,95,-173,col);}
 function scene(id,description,draw){window.SCENES[id]={dur:8,width:360,label:description,draw(g,S){
  const raw=S.on?S.u*8:0;
  // The lesson stops at 6.1s. If the runtime loops, smoothly return to the idle pose.
  const t=raw<=6.1?raw:6.1*(1-phase(raw,6.1,8));
  draw(g,S,t);
 }};}
 scene('unit5-reading','阅读示意：希望长大；竹林减少带来困难；保护区等行动帮助保护熊猫。',(g,S,t)=>{
  const grown=phase(t,.3,1.6),loss=phase(t,2,3.3),protection=phase(t,4,5.5);
  label(g,t<2?'希望的成长':t<4?'竹林减少，生存受影响':'采取行动，保护栖息地',0,-173);
  keeper(g,S,-123,protection*.65);label(g,'饲养员',-123,24);
  bamboo(g,115,1-loss*.8+protection*.8);bamboo(g,145,1-loss*.8+protection*.8);
  panda(g,42,0,.35+.5*grown);
  g.save();g.globalAlpha*=protection;rr(g,-6,-122,172,133,12);g.strokeStyle=green;g.lineWidth=2;g.stroke();label(g,'保护区',80,-133,green,13);g.restore();
  label(g,t<2?'幼崽 → 长大':t<4?'食物与家园':'法律 · 保护区 · 科研',55,24,t<4&&t>=2?red:green,12);
 });
 scene('unit5-verb','计划保护动物，决定不伤害；对比 enjoy watching 的不同动词搭配。',(g,S,t)=>{
  const reveal=phase(t,.4,1.6),negative=phase(t,2,3.3),enjoy=phase(t,4,5.3);
  caption(g,t<2?'plan':t<4?'decide':'enjoy',t<2?'to do':t<4?'not to do':'doing');
  keeper(g,S,-120,reveal*.5);label(g,'我们',-120,24);
  panda(g,65,0,.82);bamboo(g,137);
  g.save();g.globalAlpha*=reveal*(1-enjoy);rr(g,-59,-81,81,40,7);inkFill(g,'#eff5e8',1,green);label(g,t<2?'保护计划':'不伤害',-18,-56,green,12);g.restore();
  g.save();g.globalAlpha*=negative*(1-enjoy);ln(g,35,-120,91,-120,2,red);label(g,'not',63,-133,red);g.restore();
  g.save();g.globalAlpha*=enjoy;const y=-100+Math.sin(t*3)*2;ln(g,53,y,65,y+4,2,blue);ln(g,65,y+4,77,y,2,blue);label(g,'观鸟',2,-68,green,13);g.restore();
 });
 scene('unit5-purpose','从张贴海报这个动作，连到告诉人们野生动物知识的目的；再看保护区保护动物。',(g,S,t)=>{
  const tell=phase(t,2,3.4),reserve=phase(t,4,5.4);
  caption(g,t<4?'张贴海报':'建立保护区',t<4?'传播知识':'保护动物');
  keeper(g,S,-125,.5);keeper(g,S,125,0);
  g.save();g.globalAlpha*=1-reserve;rr(g,-43,-118,85,109,7);inkFill(g,'#fffdf4',2,green);label(g,'WILDLIFE',0,-95,green,12);panda(g,0,-27,.6);g.restore();
  g.save();g.globalAlpha*=tell*(1-reserve);arrow(g,[[51,-70],[83,-70]],{col:green,head:5});g.restore();
  g.save();g.globalAlpha*=reserve;rr(g,-48,-119,96,126,10);g.strokeStyle=green;g.lineWidth=2;g.stroke();panda(g,0,0,.85);label(g,'保护区',0,-133,green,12);g.restore();
  label(g,'行动',-125,25);label(g,'目的',125,25,green);
 });
 scene('unit5-ask','饲养员要求游客不要喂动物，展示 ask sb not to do 的对象和要求。',(g,S,t)=>{
  caption(g,'ask / tell','sb to do');keeper(g,S,-120,phase(t,.5,1.5)*.7);
  panda(g,117,0,.72);
  rr(g,-46,-116,95,77,8);inkFill(g,'#fff7f3',1.5,red);
  label(g,'请勿投喂',1,-87,red,13);label(g,'not to feed',1,-61,red,12);
  label(g,'饲养员的要求',-92,25);label(g,'保护动物',107,25,green);
 });
 scene('unit5-help','两个保护者共同照料动物，help sb do 和 help sb to do 两种表达都正确。',(g,S,t)=>{
  caption(g,'help sb','(to) do');keeper(g,S,-120,phase(t,.5,1.5)*.55);keeper(g,S,120,0);
  panda(g,0,0,.85);label(g,'我们',-120,25);label(g,'他们',120,25);
  g.save();g.globalAlpha*=phase(t,1,2.5);ln(g,-65,-132,65,-132,2,green);label(g,'一起保护',0,-146,green,13);g.restore();
 });
 scene('unit5-writing','保护倡议先说明动物困境，再提出具体行动，最后检查 kindness 和 action 等词形。',(g,S,t)=>{
  const action=phase(t,2,3.5),words=phase(t,4,5.5);
  label(g,t<2?'说明困境':t<4?'提出具体行动':'检查词形',0,-173);
  keeper(g,S,-123,action*.6);panda(g,30,0,.85);bamboo(g,121,.2+.8*action);
  label(g,t<2?'in danger':t<4?'protect their homes':'kind → kindness',40,-126,t<2?red:green,14);
  g.save();g.globalAlpha*=words;label(g,'take action',35,30,green);g.restore();
  label(g,'倡议者',-123,25);
 });
})();
