(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./english-motion.js'):root.GrowingEnglishMotion);if(typeof module==='object'&&module.exports)module.exports=api;else root.GrowingEnglishVisual=api;})(typeof globalThis!=='undefined'?globalThis:this,Motion=>{
  'use strict';
  const words=[];
  const add=(id,group,zh,sentence,translation,hint,profile)=>words.push({id,word:id.replaceAll('-',' '),group,zh,sentence,translation,hint,profile});
  add('in','space','在……里面','The ball is in the box.','球在盒子里面。','强调在一个空间的内部；in 表示位置，into 强调进入的过程。');
  add('on','space','在……上面（接触）','The ball is on the box.','球在盒子上面。','球与盒子表面接触。与 above 相比，on 的关键是接触表面。');
  add('under','space','在……下面','The ball is under the table.','球在桌子下面。','强调在某物下方，常有被上方物体遮住或覆盖的关系。');
  add('over','space','在……上方；越过','The ball goes over the wall.','球从墙的上方越过。','这里演示从上方越过障碍物；over 也可以表示覆盖或位于上方。');
  add('above','space','在……上方（较高处）','The ball is above the box.','球在盒子上方。','强调高度更高，不要求接触，也不一定正好在垂直上方。');
  add('below','space','在……下方（较低处）','The ball is below the shelf.','球在架子下方。','强调位置或高度较低，不要求被上面的物体覆盖。');
  add('behind','space','在……后面','The ball is behind the box.','球在盒子后面。','看遮挡关系：盒子挡住了球的一部分；虚线帮助你辨认被挡住的位置。');
  add('beside','space','在……旁边','The ball is beside the box.','球在盒子旁边。','强调在旁边。beside 表示位置，注意不要与 besides（此外）混淆。');
  add('between','space','在……之间','The ball is between two boxes.','球在两个盒子之间。','常用于两个或多个明确、可区分的对象之间，不只限于两个。');
  add('among','space','在……之中','The ball is among the stones.','球在一群石头之中。','把周围事物看作一个群体，球处于这个群体之中。');
  add('into','space','进入……里面','The ball rolls into the box.','球滚进盒子里。','观察从外到内的变化。into 表示方向和过程；in 表示所在位置。');
  add('out-of','space','从……里面出来','The ball rolls out of the box.','球从盒子里滚出来。','与 into 相反：起点在里面，终点在外面。');
  add('across','space','横过；从表面穿过','The ball rolls across the bridge.','球滚过桥面。','从一侧到另一侧，通常沿物体表面或横跨一片区域。');
  add('through','space','穿过（内部）','The ball rolls through the tunnel.','球滚着穿过隧道。','从内部或被包围的空间穿过，对照 across 的表面路径。');
  add('around','space','围绕；在……周围','The ball moves around the box.','球绕着盒子移动。','沿周围的路径移动；它也可表示分布在某物周围。');
  add('towards','space','朝向；向着','The ball rolls towards the box.','球朝盒子滚去。','与目标的距离逐渐变小，不一定到达。toward 是另一种常用形式。');
  add('away-from','space','远离……','The ball rolls away from the box.','球滚着远离盒子。','与目标的距离逐渐变大；与 towards 对照观察。');
  // Motion profiles are shared with the articulated renderer.
  add('walk','motion','走；步行','I walk to school.','我步行去学校。','普通步行：步幅和节奏适中。');
  add('march','motion','齐步走；行进','The soldiers march together.','士兵们齐步行进。','节奏整齐、抬膝明显，常用于队列行进。');
  add('stride','motion','大步走','She strides across the room.','她大步走过房间。','比普通步行迈得更大，动作有力、目的明确。');
  add('shuffle','motion','拖着脚走','He shuffles towards the door.','他拖着脚朝门口走去。','脚几乎不离地，步幅小，像在地面上蹭着走。');
  add('stroll','motion','散步；悠闲地走','We stroll in the park.','我们在公园里悠闲地散步。','速度慢，姿态放松；强调轻松、悠闲的状态。');
  add('wander','motion','闲逛；漫游','They wander around the town.','他们在镇上闲逛。','没有固定路线或明确目的，路径会来回变化。');
  add('limp','motion','跛行；一瘸一拐地走','He limps after hurting his leg.','他腿受伤后，一瘸一拐地走。','左右步态不对称；一条腿的抬起和落地明显不同。');
  add('sidle','motion','悄悄地侧身移动','She sidles towards the door.','她悄悄侧身朝门口移动。','身体侧向移动，常带有不引人注意或小心接近的意思。');
  add('slink','motion','偷偷地溜走','The cat slinks away.','猫悄悄地溜走了。','低着身子、轻手轻脚，尽量不被发现。');
  add('skip','motion','蹦蹦跳跳地走','The child skips along the path.','孩子沿着小路蹦蹦跳跳地走。','一步接着一跳，节奏轻快；对照普通步行的平稳身体起伏。');
  add('tiptoe','motion','踮着脚尖走','Please tiptoe past the baby.','请踮着脚尖从宝宝身边走过。','脚跟抬起，用脚尖轻轻落地，常用于保持安静。');
  add('flounce','motion','气冲冲地走','She flounces out of the room.','她气冲冲地走出房间。','带着明显的不满或恼怒，身体与手臂动作夸张。');
  add('jog','motion','慢跑','We jog every morning.','我们每天早晨慢跑。','轻松、持续的小步跑；节奏比步行快，但不追求最快速度。');
  add('run','motion','跑','The boy runs to the playground.','男孩跑向操场。','比走更快，步幅更大，示意中能看到双脚腾空的阶段。');
  add('dash','motion','猛冲；急奔','He dashes to catch the bus.','他猛冲过去赶公交车。','强调突然、急忙地冲向某处；动作快速、身体明显前倾。');
  add('sprint','motion','冲刺；全速短跑','She sprints to the finish line.','她全速冲向终点线。','强调在短距离内尽全力跑，摆臂有力、步频很高。');
  for(const w of words)if(w.group==='motion')w.profile=Motion.profiles[w.id];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=x=>Number(x.toFixed(3)),clamp=t=>Math.max(0,Math.min(1,Number.isFinite(t)?t:0));
  function spatialPosition(id,time){
    const t=clamp(time),fixed={in:[350,222],on:[350,168],under:[350,263],above:[350,110],below:[350,267],behind:[390,223],beside:[200,250],between:[320,247],among:[320,235]};
    let p=fixed[id]||[320,220];
    if(id==='over')p=[120+400*t,238-164*Math.sin(Math.PI*t)];
    if(id==='into')p=[110+240*t,230];
    if(id==='out-of')p=[350-240*t,230];
    if(id==='across')p=[100+440*t,208];
    if(id==='through')p=[100+440*t,230];
    if(id==='around')p=[320+140*Math.cos(2*Math.PI*t),225+65*Math.sin(2*Math.PI*t)];
    if(id==='towards')p=[110+150*t,250];
    if(id==='away-from')p=[260-150*t,250];
    return {x:n(p[0]),y:n(p[1]),radius:24};
  }
  const rect=(x,y,w,h,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" ${extra}/>`;
  const box=(x=292,y=192,w=116,h=90)=>`<g>${rect(x,y,w,h,'#f1d38a')}<path d="M${x} ${y}l22 -17h${w}l-22 17Z" fill="#fff0be"/><path d="M${x+w} ${y}l22 -17v${h}l-22 17Z" fill="#d1ab60"/></g>`;
  const text=(x,y,s,size=14,fill='#67746b')=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="system-ui,Microsoft YaHei,sans-serif" font-size="${size}" fill="${fill}">${esc(s)}</text>`;
  const arrow=(path)=>`<path d="${path}" fill="none" stroke="#9683b6" stroke-width="3" stroke-dasharray="6 7" marker-end="url(#ARROW)"/>`;
  function spatialScene(e,t,scope){
    const p=spatialPosition(e.id,t),orb=`<g data-ball="true" transform="translate(${p.x} ${p.y})"><ellipse cy="29" rx="24" ry="5" fill="#453e4c15"/><circle r="24" fill="url(#${scope}-orb)"/><circle cx="-8" cy="-9" r="7" fill="#fff" opacity=".5"/></g>`;
    let rear='',front='',guide='';
    if(['in','into','out-of'].includes(e.id)){
      rear=`${rect(288,184,124,105,'#c19b5d')}<ellipse cx="350" cy="184" rx="62" ry="17" fill="#9f7d4c"/>`;
      // Front lip hides the part of the ball inside the open container.
      front=`<path d="M288 239Q350 261 412 239V284Q350 304 288 284Z" fill="#efcf85"/><path d="M288 239Q350 261 412 239" fill="none" stroke="#ffeab6" stroke-width="5"/>`;
      if(e.id!=='in')guide=arrow(e.id==='into'?'M110 310H350':'M350 310H110');
    }else if(e.id==='on'||e.id==='above'){rear=box();if(e.id==='above')guide=arrow('M458 185V112');}
    else if(e.id==='under'){rear=rect(233,186,234,20,'#efcf85')+rect(250,206,17,91,'#d1ab60')+rect(433,206,17,91,'#d1ab60');}
    else if(e.id==='over'){rear=box(285,225,70,63);guide=arrow('M120 238Q320 -70 520 238');}
    else if(e.id==='below'){rear=rect(254,170,194,20,'#efcf85');guide=arrow('M472 202V268');}
    else if(e.id==='behind'){front=box(276,189,113,99)+`<circle cx="${p.x}" cy="${p.y}" r="24" fill="none" stroke="#8d69c0" stroke-dasharray="4 5" opacity=".7"/>`;}
    else if(e.id==='beside'){rear=box(300,190);guide=arrow('M266 260H232');}
    else if(e.id==='between'){rear=box(154,192,70,90)+box(416,192,70,90);}
    else if(e.id==='among'){rear=box(209,175,51,49)+box(377,171,49,50)+box(257,133,49,50);front=box(230,281,47,38)+box(386,273,46,38);}
    else if(e.id==='across'){rear=`<path d="M80 250Q120 230 160 250T240 250T320 250T400 250T480 250T560 250V290H80Z" fill="#c9e5e0"/>${rect(80,232,480,13,'#edcf8c')}`;guide=arrow('M100 175H540');}
    else if(e.id==='through'){rear=rect(260,155,120,140,'#bda6c7');front=`<path d="M260 155H380V295H365V210Q320 150 275 210V295H260Z" fill="#e2cee4"/>`;guide=arrow('M100 315H540');}
    else if(e.id==='around'){guide=`<ellipse cx="320" cy="225" rx="140" ry="65" fill="none" stroke="#b0a2c6" stroke-dasharray="6 7"/>`;if(p.y<225)front=box(274,191,92,80);else rear=box(274,191,92,80);}
    else {rear=box(350,190);guide=arrow(e.id==='towards'?'M110 308H260':'M260 308H110');}
    const focus=`<circle cx="${p.x}" cy="${p.y}" r="32" fill="none" stroke="#bba2cf" stroke-width="2" opacity="${n(.2+.18*Math.sin(t*Math.PI*2))}"/>`;
    return `<ellipse cx="330" cy="302" rx="203" ry="11" fill="#6676530b"/>${guide}${rear}${focus}${orb}${front}`.replaceAll('#ARROW',`#${scope}-arrow`);
  }
  const gait=Motion.pose,motionScene=Motion.scene;
  function svg(e,time=0,scope='scene'){
    if(typeof e==='string')e=words.find(w=>w.id===e);if(!e)throw new Error('Unknown vocabulary');
    const t=clamp(time);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 350" role="img" aria-label="${esc(e.word+'：'+e.zh+'，动作示意')}" data-word="${e.id}"><defs><radialGradient id="${scope}-orb" cx="30%" cy="25%"><stop stop-color="#d6c3f1"/><stop offset=".6" stop-color="#a582ce"/><stop offset="1" stop-color="#7956a4"/></radialGradient><marker id="${scope}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="none" stroke="#9683b6" stroke-width="2"/></marker></defs>${e.group==='space'?spatialScene(e,t,scope):motionScene(e,t)}</svg>`;
  }
  return {words,svg,spatialPosition,gait,motionProfiles:Motion.profiles,compareSvg:Motion.compare,esc};
});
