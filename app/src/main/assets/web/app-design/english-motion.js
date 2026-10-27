(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GrowingEnglishMotion=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const GROUND=278,TAU=Math.PI*2;
  const n=x=>Number(x.toFixed(3)),point=(x,y)=>({x:n(x),y:n(y)});
  const profiles={
    walk:{stride:56,lift:18,duty:.64,cycles:3,velocity:48,lean:3,hip:95,bounce:3,arm:25,bend:15,pair:'run',cue:'交替迈步 · 一脚始终着地',tags:'步幅适中 / 上身平稳'},
    march:{stride:60,lift:64,duty:.58,cycles:3,velocity:48,lean:0,hip:96,bounce:1,arm:47,bend:8,pair:'walk',cue:'高抬膝，整齐地踏下',tags:'抬腿高 / 摆臂整齐'},
    stride:{stride:112,lift:24,duty:.66,cycles:3,velocity:84,lean:9,hip:88,bounce:3,arm:39,bend:15,pair:'walk',cue:'一步跨得很远',tags:'大步幅 / 有力迈进'},
    shuffle:{stride:20,lift:1.5,duty:.79,cycles:3,velocity:13,lean:23,hip:84,bounce:0,arm:4,bend:8,pair:'walk',cue:'脚贴着地面，向前蹭',tags:'几乎不抬脚 / 小碎步'},
    stroll:{stride:43,lift:12,duty:.71,cycles:2,velocity:26,lean:-5,hip:96,bounce:2,arm:9,bend:10,pair:'walk',cue:'放松身体，慢慢散步',tags:'慢节奏 / 摆臂松弛'},
    wander:{stride:42,lift:14,duty:.69,cycles:2,velocity:24,lean:1,hip:94,bounce:3,arm:16,bend:14,pair:'stroll',cue:'走走停停，转头、换方向',tags:'路线不固定 / 四处张望'},
    limp:{stride:48,lift:30,duty:.66,cycles:3,velocity:22,lean:12,hip:88,bounce:11,arm:13,bend:24,pair:'walk',cue:'一腿正常迈步，一腿拖跟',tags:'左右不对称 / 身体偏摆'},
    sidle:{stride:40,lift:9,duty:.72,cycles:2,velocity:21,lean:0,hip:88,bounce:1,arm:0,bend:0,pair:'walk',cue:'脸朝前，身体向侧面挪',tags:'横向并步 / 不正面迈进'},
    slink:{stride:65,lift:13,duty:.73,cycles:2,velocity:27,lean:43,hip:42,bounce:2,arm:14,bend:76,pair:'walk',cue:'压低身体，屈膝悄悄溜走',tags:'低重心 / 小心落脚'},
    skip:{stride:60,lift:34,duty:.58,cycles:4,velocity:60,lean:1,hip:91,bounce:5,arm:42,bend:28,pair:'walk',cue:'一步，再同脚一跳；换脚重复',tags:'明显腾空 / 一步一跳'},
    tiptoe:{stride:35,lift:22,duty:.67,cycles:3,velocity:25,lean:-3,hip:107,bounce:1,arm:10,bend:58,pair:'walk',cue:'脚跟抬起，只用脚尖轻落地',tags:'脚跟不落地 / 轻声移动'},
    flounce:{stride:72,lift:42,duty:.65,cycles:3,velocity:64,lean:-13,hip:88,bounce:7,arm:62,bend:35,pair:'stroll',cue:'重重落脚，甩臂，气冲冲地走',tags:'夸张摆臂 / 生气跺步'},
    jog:{stride:62,lift:34,duty:.42,cycles:4,velocity:77,lean:8,hip:89,bounce:8,arm:31,bend:90,pair:'run',cue:'小步、轻弹，持续慢跑',tags:'小步跑 / 节奏均匀'},
    run:{stride:94,lift:52,duty:.35,cycles:5,velocity:125,lean:18,hip:89,bounce:11,arm:49,bend:95,pair:'jog',cue:'后腿蹬出，双脚有腾空阶段',tags:'大步跑 / 前倾摆臂'},
    dash:{stride:116,lift:58,duty:.3,cycles:6,velocity:170,lean:38,hip:82,bounce:10,arm:62,bend:100,pair:'run',cue:'俯身起步，突然加速猛冲',tags:'起步爆发 / 加速冲向目标'},
    sprint:{stride:126,lift:70,duty:.27,cycles:7,velocity:210,lean:26,hip:86,bounce:13,arm:72,bend:104,pair:'run',cue:'高抬腿、强摆臂，全速冲刺',tags:'最快步频 / 大幅蹬伸'}
  };
  function foot(phase,p,injured=false){
    const u=(phase%1+1)%1,duty=injured ? .87 : p.duty,stride=injured?p.stride*.34:p.stride;
    let x,lift,stance=u<duty;
    if(stance){x=stride*(.5-u/duty);lift=0;}
    else{const q=(u-duty)/(1-duty);x=-stride/2+stride*(q*q*(3-2*q));lift=(injured?3:p.lift)*Math.sin(Math.PI*q);}
    return {x:n(x),lift:n(lift),stance};
  }
  // Two rigid segments keep knees and ankles separate, including bent/crouched poses.
  function joint(a,b,l1,l2,forward=1){
    const dx=b.x-a.x,dy=b.y-a.y,raw=Math.hypot(dx,dy)||.001,d=Math.min(l1+l2-.001,Math.max(Math.abs(l1-l2)+.001,raw));
    const along=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-along*along));
    return point(a.x+dx/raw*along+dy/raw*h*forward,a.y+dy/raw*along-dx/raw*h*forward);
  }
  function pose(e,time){
    const id=typeof e==='string'?e:e.id,p=profiles[id];if(!p)throw new Error('Unknown movement');
    const t=Math.max(0,Math.min(1,Number.isFinite(time)?time:0)),phase=t*p.cycles,cycle=(phase%1+1)%1;
    let left=foot(cycle,p),right=foot(cycle+.5,p,id==='limp'),hop=0,direction=1,x=320;
    if(id==='march')for(const f of [left,right])if(!f.stance)f.x+=f.lift*.94;
    if(id==='skip'){
      // A step-hop on one supporting foot, then change the supporting foot.
      const support=Math.floor(phase)%2===0?'left':'right';hop=42*Math.pow(Math.max(0,Math.sin(TAU*cycle)),1.4);
      const q=Math.max(0,(cycle-.55)/.45),blend=q*q*(3-2*q);
      const planted={x:14-41*blend,lift:40*blend,stance:q===0&&hop<.1},swinging={x:-27+41*blend,lift:40*(1-blend),stance:q>.99};
      left=support==='left'?planted:swinging;right=support==='right'?planted:swinging;
    }
    if(id==='sidle'){
      const open=(1-Math.cos(TAU*cycle))/2;
      left={x:-14-26*open,lift:7*Math.max(0,Math.sin(TAU*cycle)),stance:cycle>=.5};
      right={x:14+12*open,lift:5*Math.max(0,-Math.sin(TAU*cycle)),stance:cycle<.5};
    }
    if(id==='wander'){x=320+34*Math.sin(TAU*t);direction=Math.cos(TAU*t)>=0?1:-1;}
    const bounce=id==='limp'?p.bounce*Math.max(0,Math.sin(TAU*cycle)):p.bounce*Math.abs(Math.sin(TAU*cycle));
    const hip=point(0,GROUND-p.hip-hop-bounce),lean=id==='dash'?24+22*Math.exp(-8*t):p.lean;
    // Keep each foot target reachable without stretching either rigid leg segment.
    for(const f of [left,right]){
      const ankleY=GROUND-7-f.lift-hop-(id==='tiptoe'?16:0);
      hip.y=n(Math.max(hip.y,ankleY-Math.sqrt(101.8**2-f.x**2)));
    }
    const a=lean*Math.PI/180,shoulder=point(hip.x+Math.sin(a)*58,hip.y-Math.cos(a)*58),head=point(shoulder.x+Math.sin(a)*19,shoulder.y-29);
    const makeLeg=(f,side)=>{
      const toeLift=id==='tiptoe'?16:0,ankle=point(f.x,GROUND-7-f.lift-hop-toeLift);
      const knee=joint(hip,ankle,51,51,id==='sidle'?(side==='left'?-1:1):1);
      const toe=point(ankle.x+17,GROUND-3-f.lift-hop),heel=point(ankle.x-9,GROUND-3-f.lift-hop-(id==='tiptoe'?22:0));
      return {...f,ankle,knee,toe,heel,contact:f.stance&&hop<.1};
    };
    const legs={left:makeLeg(left,'left'),right:makeLeg(right,'right')};
    const arm=(offset,side)=>{
      const angle=(Math.sin(TAU*cycle+offset)*p.arm)*Math.PI/180,bend=p.bend*Math.PI/180;
      let elbow=point(shoulder.x+Math.sin(angle)*31,shoulder.y+Math.cos(angle)*31),hand=point(elbow.x+Math.sin(angle+bend)*29,elbow.y+Math.cos(angle+bend)*29);
      if(id==='sidle'){elbow=point(shoulder.x+(side==='left'?-30:30),shoulder.y+21);hand=point(elbow.x,elbow.y-25);}
      if(id==='slink'){elbow=point(shoulder.x+28,shoulder.y+16);hand=point(shoulder.x+52,shoulder.y+4);}
      return {elbow,hand};
    };
    let distance=p.velocity*t*4;
    if(id==='wander')distance=100*Math.sin(TAU*t);
    if(id==='dash')distance=p.velocity*4*(.15*t+.85*t*t);
    return {id,x:n(x),direction,hop:n(hop),hip,shoulder,head,legs,arms:{left:arm(0,'left'),right:arm(Math.PI,'right')},lean:n(lean),distance:n(distance),phase:n(cycle),speed:p.velocity,
      left:{x:legs.left.x,y:n(-legs.left.lift-hop)},right:{x:legs.right.x,y:n(-legs.right.lift-hop)},swing:n(Math.sin(TAU*cycle)),airborne:!legs.left.contact&&!legs.right.contact};
  }
  const line=(a,b,color,width,extra='')=>`<path d="M${a.x} ${a.y}L${b.x} ${b.y}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
  // Xiaohei character adapted from Ian Xiaohei Illustrations (MIT).
  // Source and license: english-motion-NOTICE.txt.
  function actor(e,t,cx=320){
    const g=pose(e,t),id=g.id,front=id==='sidle',center=cx+(id==='wander'?g.x-320:0),ink='#161616';
    const limb=(points,width,back=false)=>{
      const d=points.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join('');
      return `${back?'':`<path d="${d}" fill="none" stroke="white" stroke-width="${width+2.2}" stroke-linecap="round" stroke-linejoin="round"/>`}<path d="${d}" fill="none" stroke="${ink}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    };
    const leg=(l,back)=>{
      const hip=point(g.hip.x+(back?-7:7),g.hip.y-1);
      let result=limb([hip,l.knee,l.ankle],back?4.2:4.6,back)+limb([l.heel,l.toe],4.2,back);
      if(id==='limp'&&back)result+=`<path d="M${l.knee.x-4} ${l.knee.y-5}l8 4m-9 1l8 4" stroke="white" stroke-width="2.2"/><path d="M${l.knee.x-12} ${l.knee.y-5}l-5 -5m3 11h-7" stroke="#d24d3f" stroke-width="1.7" fill="none"/>`;
      if(id==='tiptoe'&&l.contact)result+=`<circle cx="${l.toe.x}" cy="${GROUND}" r="3" fill="#2e6dad"/><path d="M${l.heel.x-12} ${l.heel.y+8}v-18m-4 5l4 -5 4 5" stroke="#2e6dad" fill="none" stroke-width="1.5"/>`;
      if(id==='shuffle')result+=`<path d="M${l.heel.x-25} ${GROUND-1}q8 -2 17 0m-22 -5h11" stroke="#db7031" stroke-width="1.6" fill="none"/>`;
      if(id==='flounce'&&l.contact)result+=`<path d="M${l.toe.x-15} ${GROUND+5}l-8 5m30 -5l8 5" stroke="#d24d3f" stroke-width="1.8"/>`;
      return result;
    };
    const arm=(a,back)=>limb([g.shoulder,a.elbow,a.hand],back?3.5:3.9,back)+`<path d="M${a.hand.x-2} ${a.hand.y-2}q6 -3 5 4" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;
    const eyes=front?[-10,9]:[8,21];
    const body=`<g data-character="xiaohei" transform="translate(${g.hip.x} ${g.hip.y}) rotate(${g.lean} 0 0)"><path d="M-27 4C-34 -16 -33 -53 -29 -82C-27 -106 -14 -119 3 -117C23 -117 29 -96 29 -72L33 -8Q32 8 9 8Q-14 12 -27 4Z" fill="${ink}"/><path d="M-29 -77Q-32 -48 -30 -25" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>${eyes.map((x,i)=>`<circle cx="${x}" cy="${-84-i*.8}" r="3.5" fill="white"/>`).join('')}</g>`;
    const speedLines=['dash','sprint'].includes(id)?`<path d="M-88 155q18 -2 39 0m-50 20h34m-25 20h26" stroke="${ink}" stroke-width="1.5" fill="none"/>`:'';
    const markerOffset=((g.distance%62)+62)%62;
    let ground='';for(let i=-1;i<=2;i++)ground+=`<path d="M${cx+i*62-markerOffset} ${GROUND+13}h26" stroke="#bfc1c3" stroke-width="1.4"/>`;
    const terrain=`<path d="M${cx-124} ${GROUND}q60 -1 124 0t124 0" stroke="#666" stroke-width="1.2" fill="none"/>${ground}`;
    const arrow=id==='sidle'?`<path d="M${cx-42} 307h84m-9 -6 9 6 -9 6" stroke="#db7031" stroke-width="1.6" fill="none"/>`:id==='wander'?`<path d="M${cx-78} 309q25 -25 50 0t50 0t50 0" stroke="#db7031" stroke-width="1.6" fill="none"/>`:'';
    return `${terrain}<g data-person="true" data-airborne="${g.airborne}" transform="translate(${n(center)} 0) scale(${g.direction} 1)">${speedLines}${leg(g.legs.right,true)}${leg(g.legs.left,false)}${arm(g.arms.right,true)}${body}${arm(g.arms.left,false)}</g>${arrow}`;
  }
  const label=(x,y,s,size=14,color='#666')=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="system-ui,Microsoft YaHei,sans-serif" font-size="${size}" fill="${color}">${s}</text>`;
  function scene(e,t){return `<rect width="640" height="350" fill="white"/><g transform="translate(32 28) scale(.9)">${actor(e,t)}</g>`+label(320,33,profiles[e.id].cue,17,'#2e6dad')+label(320,337,profiles[e.id].tags,13);}
  function compare(e,reference,t,compact=false){
    const other=typeof reference==='string'?{id:reference,word:reference}:reference;
    const width=compact?400:640,half=width/2,cx=half/2;
    const panel=(w,selected)=>`${label(cx,39,w.word,25,'#161616')}${label(cx,64,selected?'正在学习':'对照动作',11,selected?'#c15c20':'#777')}<g transform="translate(${n(cx*.15)} 44) scale(.85)">${actor(w,t,cx)}</g>${label(cx,334,profiles[w.id].tags,12)}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 350" role="img" aria-label="${e.word} 与 ${other.word} 同步动作对照" data-word="${e.id}" data-reference="${other.id}"><rect width="${width}" height="350" fill="white"/><path d="M${half} 20v310" stroke="#ddd" stroke-dasharray="4 7" fill="none"/>${panel(other,false)}<g transform="translate(${half} 0)">${panel(e,true)}</g></svg>`;
  }
  return {profiles,pose,scene,compare};
});
