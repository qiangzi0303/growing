/* Original teaching scenes using nilbuild/stick-scene's unchanged MIT runtime. */
(()=>{
 const R=window.RIG,{P,mix,seg,E,fig,breathe,walkSeg,legs,ln,rr,inkFill,text,arrow}=R;
 const green='#15803d',blue='#275d87',red='#b91c1c';
 const rest=()=>P({hF:[12,-60],hB:[-4,-52]});
 function label(g,s,x,y,color='#39483f',size=13){
  g.save();g.font=`600 ${size}px system-ui, sans-serif`;g.textAlign='center';g.fillStyle=color;g.fillText(s,x,y);g.restore();
 }
 function tile(g,s,x,y,color,alpha=1){g.save();g.globalAlpha=alpha;rr(g,x-23,y-13,46,26,5);inkFill(g,'#fff',1.8,color);label(g,s,x,y+4,color,16);g.restore();}
 window.SCENES['grammar-make']={
  dur:8,width:360,label:'老板要求员工工作。主动句强调老板；被动句强调员工，be made 后要补回 to。',
  draw(g,S){
   const T=S.on?S.u*8:0,fade=1-E.soft(seg(T,6.6,8));
   const action=E.soft(seg(T,.5,1.4))*fade,passive=E.soft(seg(T,2.8,3.8))*fade;
   // Work is the same event in both sentences; only the focus and grammar change.
   const focusX=-113+(153*passive);
   g.save();g.fillStyle='#ecf4df';g.beginPath();g.ellipse(focusX,1,32,7,0,0,Math.PI*2);g.fill();g.restore();
   ln(g,65,-57,145,-57,3);ln(g,72,-57,72,0,2);ln(g,137,-57,137,0,2);
   rr(g,86,-94,41,31,3);inkFill(g,'#f0f3ee',1.6);ln(g,65,-62,132,-62,2);
   label(g,'make',-90,-162,blue,15);arrow(g,[[-50,-167],[-12,-167]],{col:'#8b968e',head:5});
   label(g,'be made',37,-162,blue,15);tile(g,'to',122,-166,green,passive);
   const boss=mix(rest(),P({hF:[35,-84],hB:[-4,-52]}),action);
   const typing=P({hF:[31,-70+Math.sin(S.t*10)*.6],hB:[23,-68]});
   fig(g,breathe(boss,S.t),-113,0,{ink:blue,far:'#a4b9cc'});
   fig(g,breathe(mix(rest(),typing,action),S.t),40,0,{ink:'#303d35',far:'#a3b1a6'});
   label(g,'老板',-113,24,blue);label(g,'员工',40,24);
  }
 };
 function crossing(id,partial){
  window.SCENES[id]={dur:8,width:360,label:partial?'只看见过桥中途的一段，强调正在过桥。':'从走上桥到走下桥都看见了，强调完整过程。',draw(g,S){
   const T=S.on?S.u*8:0;
   // Teaching playback stops before reset. Fade out, reset invisibly, then fade in for a clean loop.
   const reset=T>=7,alpha=T<6.2?1:T<7?1-E.soft(seg(T,6.2,6.9)):E.soft(seg(T,7.1,8));
   const ws=walkSeg(reset?0:T,.5,5.5,-70,125);
   g.save();g.fillStyle='#e9f2f7';g.fillRect(-54,-5,160,12);g.restore();
   ln(g,-55,-4,105,-4,3,'#798b7a');ln(g,-55,-42,105,-42,2,'#bac6b8');
   for(const x of [-55,-15,25,65,105])ln(g,x,-42,x,-4,1.4,'#bac6b8');
   label(g,'起点',-70,25);label(g,'终点',126,25);
   const visible=partial?(T>=2.3&&T<=3.9):true;
   const observing=partial?E.soft(seg(T,2,2.3))*(1-E.soft(seg(T,3.9,4.2))):1;
   const watcher=mix(rest(),P({hF:[32,-84],hB:[-4,-52]}),observing*.7);
   fig(g,breathe(watcher,S.t),-135,0,{ink:blue,far:'#a4b9cc'});
   label(g,'我',-135,25,blue);
   const pose=legs(rest(),ws.ph,ws.amp,{arms:false,stride:ws.stride});
   fig(g,pose,ws.x,0,{ink:green,far:'#9ebca8',alpha:partial?alpha*(.12+.88*observing):alpha});
   // Observation strip: the highlighted interval is what the observer sees.
   ln(g,-65,-162,135,-162,5,'#e2e7e1');
   ln(g,partial?7:-65,-162,partial?71:135,-162,5,blue);
   const cursor=-65+200*seg(reset?0:T,.5,5.5);
   g.save();g.globalAlpha=alpha;g.fillStyle=visible?green:'#9ba59c';g.beginPath();g.arc(cursor,-162,5,0,Math.PI*2);g.fill();g.restore();
   label(g,partial?'只看见中途这一段':'从开始到结束都看见',35,-178,blue,12);
  }};
 }
 crossing('grammar-see-whole',false);crossing('grammar-see-part',true);
})();
