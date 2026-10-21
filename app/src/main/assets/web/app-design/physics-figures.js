/* Original SVG schematics. Distances and apparatus are illustrative unless stated. */
(() => {
  'use strict';
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text=(x,y,s,color='#29495c',size=20)=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="middle">${esc(s)}</text>`;
  const line=(x1,y1,x2,y2,color='#477c9e',dash=false)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="3" fill="none" ${dash?'stroke-dasharray="7 5"':''}/>`;
  const arrow=(x1,y1,x2,y2,color='#477c9e',dash=false)=>{const a=Math.atan2(y2-y1,x2-x1),s=9;return line(x1,y1,x2,y2,color,dash)+`<path d="M${x2-s*Math.cos(a-.45)} ${y2-s*Math.sin(a-.45)}L${x2} ${y2}L${x2-s*Math.cos(a+.45)} ${y2-s*Math.sin(a+.45)}" stroke="${color}" stroke-width="3" fill="none"/>`;};
  function flow(labels,notes=[]){return labels.map((s,i)=>`<rect x="${20+i*185}" y="65" width="150" height="75" rx="12" fill="${i===1?'#dceaf0':'#eaf1e6'}"/>${text(95+i*185,109,s)}${text(95+i*185,178,notes[i]||'', '#5a6c75',17)}`).join('')+arrow(175,102,200,102)+arrow(360,102,385,102);}
  const pair=(left,right,sub1,sub2)=>`<rect x="30" y="45" width="230" height="140" rx="12" fill="#e8f0f5"/><rect x="300" y="45" width="230" height="140" rx="12" fill="#edf1e6"/>${text(145,95,left)}${text(415,95,right)}${text(145,140,sub1,'#58748a',18)}${text(415,140,sub2,'#647951',18)}`;
  const axes=(vertical,horizontal='t / s')=>arrow(70,195,510,195)+arrow(70,195,70,25)+text(68,19,vertical,'#29495c',18)+text(510,225,horizontal,'#29495c',18);
  function trace(y,amp,cycles,color){let d='';for(let i=0;i<=400;i++){const x=85+i,v=y-amp*Math.sin(i/400*cycles*2*Math.PI);d+=(i?'L':'M')+x.toFixed(1)+' '+v.toFixed(1);}return `<path d="${d}" fill="none" stroke="${color}" stroke-width="3"/>`;}
  const waves=(kind)=>text(280,25,'振动位移随时间的示意（不是声波传播形状）','#5a6c75',17)+line(80,83,490,83,'#aebec6',true)+line(80,166,490,166,'#aebec6',true)+trace(83,kind==='loudness'?12:24,kind==='pitch'?3:4,'#497b9c')+trace(166,kind==='loudness'?30:24,kind==='pitch'?6:4,'#af7843')+text(280,220,kind==='pitch'?'相同时间：下面振动次数多，频率大、音调高':kind==='loudness'?'相同条件：下面振幅大，通常听起来更响':'音调、响度相近，也可因音色不同辨出声源', '#29495c',18);
  const lensShape=(x=280)=>`<path d="M${x} 40Q${x-28} 120 ${x} 210Q${x+28} 120 ${x} 40Z" fill="#d9eaf1" stroke="#477c9e" stroke-width="2"/>`;
  const captions={
    source:'把音叉的小振动转换成小球的明显运动，建立“振动—发声”的证据。',
    medium:'声源与接收者之间需要传声介质；抽气实验从声音减弱推测真空不传声。',
    echo:'回声计时包含去、回两段；同处收发时单程距离d=vt/2。',
    pitch:'比较相同时间内的振动次数，判断频率与音调；振幅保持相同。',
    loudness:'保持频率和接收距离等条件相同，比较振幅对响度的影响。',
    timbre:'高低、强弱与声音特色是不同维度，不能互相代替。',
    noise:'按“声源—传播—接收”的路径选择降噪措施。',
    frequency:'20 Hz与20000 Hz只是通常听觉范围的近似边界，实际因人而异。',
    spectrum:'三棱镜分开白光中的多种色光；光谱示意不按实际偏折角比例。',
    rgb:'色光相加与颜料混合规则不同；三原色光的适当比例可叠加成白光。',
    pinhole:'同种均匀介质中，物体上下端的光穿过小孔后上下交换位置，形成倒像。',
    mirror:'对应点沿镜面法线等距对称，虚像用虚线表示；不是光在镜后真实会聚。',
    'mirror-lab':'棋子A的像与相同棋子B重合，用B替代像确定位置和比较大小。',
    reflection:'图中入射角与反射角均为45°，两个角都从法线量起。',
    diffuse:'粗糙表面各处法线方向不同，但每条反射光仍遵守反射定律。',
    refraction:'从空气斜射入水，折射光偏向法线；垂直入射时方向不变。',
    shallow:'从水底到眼睛追踪光路，再反向延长出水光线：看起来的位置更浅。',
    lens:'同样的平行入射光，凸透镜使其会聚，凹透镜使其发散。',
    focus:'焦距是光心O到单侧焦点F的距离；两焦点间距为2f。',
    imaging:'按u与f、2f的大小比较分类，注意u=f的特殊情况。',
    'lens-lab':'实像范围内物近像远像变大；三中心大致同高，光屏移动到最清晰的位置。',
    applications:'同一凸透镜的用途随物距改变，不能用“放大镜”名称代替成像条件。',
    eye:'近视用凹透镜使会聚位置后移；远视用凸透镜使会聚位置前移。',
    instruments:'图示为本课开普勒望远镜与光学显微镜的成像流程；望远镜还有其他结构。',
    invisible:'红外线与紫外线位于可见光谱两端之外，眼睛看不见但能传递能量。',
    temperature:'普通实验液体温度计应留在液体中等稳定后读数，玻璃泡不碰容器底壁。',
    cooling:'原创冷却数据(0,80)、(2,70)、(4,63)：等时间内温降变小，趋势趋缓。',
    evaporation:'每次只改变一个条件，才能判断温度、表面积或空气流动的影响。',
    boiling:'一定气压下，沸腾平台温度不变，但仍须持续吸热。',
    liquid:'先判断气到液，再命名为液化并判断放热；白气不是可见的气态水。',
    melting:'晶体熔化平台处固液共存、吸热而温度不变；示意平台为0 ℃的冰。',
    sublimation:'固态与气态直接互变，不经过液态；先辨状态，再判断吸放热。',
    'water-cycle':'水循环的简化路径：每一步分别判断状态变化，降雨和径流还包含位置变化。',
    length:'分度值1 mm，估读到0.01 cm；从2.00 cm起测需减去初读数，得3.35 cm。',
    error:'对同一对象重复规范测量可减小某些随机误差，不能消除全部误差或代替纠错。',
    time:'20个完整来回共32.0 s，一个完整来回平均1.60 s；次数不是单程数。',
    speed:'速度公式的路程与时间必须属于同一过程，单位须配套。',
    uniform:'原创s—t数据(0,0)、(2,6)、(4,12)：斜率3 m/s，直线图像不是运动轨迹。',
    average:'列车完全过桥，车头运动路程是桥长加车长；平均速度用总路程除以总时间。',
    reference:'同一乘客，相对车厢静止，相对地面运动；两种判断的参照物不同。'
  };
  const drawings={
    source:()=>flow(['音叉振动','小球被弹开','观察到证据'],['真实声源','放大可见变化','转换法']),
    medium:()=>flow(['声源振动','介质传声','接收者'],['产生声音','固体 / 液体 / 气体','真空不能传声']),
    echo:()=>`<rect x="450" y="35" width="25" height="160" fill="#b5c7cf"/>${text(95,65,'原地收发')}${text(463,220,'障碍物')}${arrow(110,100,440,100)}${arrow(440,160,110,160,'#af7843')}${text(280,80,'去程d')}${text(280,191,'回程d')}${text(280,240,'vt = 2d','#29495c',23)}`,
    pitch:()=>waves('pitch'),loudness:()=>waves('loudness'),
    timbre:()=>flow(['音调：高低','响度：强弱','音色：特色'],['频率','振幅、距离等','材料、结构等']),
    noise:()=>flow(['声源处','传播途中','接收处'],['禁止鸣笛','隔声屏、隔声窗','耳罩、耳塞']),
    frequency:()=>`<rect x="30" y="80" width="130" height="65" fill="#e4ecf5"/><rect x="160" y="80" width="240" height="65" fill="#e6efdc"/><rect x="400" y="80" width="130" height="65" fill="#f3e6d6"/>${text(95,120,'次声')}${text(280,120,'通常可听范围')}${text(465,120,'超声')}${text(160,180,'20 Hz')}${text(400,180,'20000 Hz')}${text(280,225,'频率由低到高 →','#5a6c75',18)}`,
    spectrum:()=>{const colors=['#cb4f49','#de8c3f','#d7b538','#6f9551','#4e8bb6','#625396','#9c62b3'];return arrow(25,120,220,120,'#8a969b')+`<path d="M220 50L300 185H170Z" fill="#d9eaf1" stroke="#7391a4"/>`+colors.map((v,i)=>line(250,120,480,45+i*25,v)+text(515,50+i*25,['红','橙','黄','绿','蓝','靛','紫'][i],v,17)).join('')+text(95,90,'白光');},
    rgb:()=>`<circle cx="245" cy="95" r="62" fill="#d45e58" fill-opacity=".75"/><circle cx="205" cy="155" r="62" fill="#78a76b" fill-opacity=".75"/><circle cx="285" cy="155" r="62" fill="#6798c0" fill-opacity=".75"/><circle cx="245" cy="135" r="15" fill="white"/>${text(245,70,'红','#fff')}${text(177,175,'绿','#fff')}${text(318,175,'蓝','#fff')}${text(445,118,'三原色光')}${text(445,154,'适当比例→白光','#58748a',18)}`,
    pinhole:()=>arrow(70,185,70,55)+line(275,20,275,115,'#8199a5')+line(275,125,275,220,'#8199a5')+line(70,55,490,188,'#af7843')+line(70,185,490,52)+arrow(490,52,490,188,'#af7843')+text(70,225,'物')+text(275,247,'小孔')+text(490,225,'倒立实像'),
    mirror:()=>line(280,25,280,225,'#668c9f')+arrow(140,170,140,75)+arrow(420,170,420,75,'#af7843',true)+line(140,180,420,180,'#a9b7be',true)+text(210,210,'d')+text(350,210,'d')+text(140,50,'物')+text(420,50,'虚像')+text(280,248,'镜面'),
    'mirror-lab':()=>line(280,30,280,210,'#668c9f')+`<rect x="115" y="102" width="46" height="68" rx="8" fill="#7ca0b5"/><rect x="399" y="102" width="46" height="68" rx="8" fill="#d7c0a4" stroke="#af7843" stroke-dasharray="5 4"/>`+text(138,80,'棋子A')+text(422,80,'B与像重合')+arrow(160,190,278,190)+arrow(399,190,282,190)+text(215,222,'等距')+text(345,222,'等距')+text(280,25,'竖直玻璃板','#29495c',18),
    reflection:()=>line(60,170,500,170,'#668c9f')+line(280,15,280,220,'#a5b5bf',true)+arrow(130,20,280,170,'#af7843')+arrow(280,170,430,20)+text(236,115,'i=45°','#af7843',18)+text(327,115,'r=45°','#477c9e',18)+text(280,245,'角度从法线量起')+text(320,35,'法线','#5a6c75',17),
    diffuse:()=>{let svg=`<path d="M40 175L150 158L260 190L370 151L510 180" stroke="#668c9f" stroke-width="4" fill="none"/>`;for(const [x,x0,y0,dx,dy] of [[110,40,175,110,-17],[235,150,158,110,32],[390,370,151,140,29]]){const y=y0+(x-x0)*dy/dx,t=Math.hypot(dx,dy),tx=dx/t,ty=dy/t,vx=.18,vy=1,dot=vx*tx+vy*ty,rx=2*dot*tx-vx,ry=2*dot*ty-vy,k=(45-y)/ry;svg+=arrow(x-vx*(y-40),40,x,y,'#af7843')+arrow(x,y,x+k*rx,45);}return svg+text(280,230,'平行入射，各处按局部法线反射');},
    refraction:()=>`<rect x="30" y="120" width="500" height="110" fill="#e0eff6"/>`+line(30,120,530,120,'#98b5c6')+line(280,15,280,230,'#a3b4be',true)+arrow(120,20,280,120,'#af7843')+arrow(280,120,350,230)+text(470,75,'空气')+text(470,170,'水')+text(200,247,'入水偏向法线','#29495c',20),
    shallow:()=>`<rect x="30" y="120" width="500" height="115" fill="#e0eff6"/>`+line(30,120,530,120,'#98b5c6')+arrow(170,210,280,120)+arrow(280,120,460,30)+line(280,120,170,175,'#af7843',true)+`<circle cx="170" cy="210" r="7" fill="#477c9e"/><circle cx="170" cy="175" r="7" fill="none" stroke="#af7843"/>`+text(115,221,'实物')+text(108,168,'虚像')+text(480,27,'眼睛')+text(455,185,'水中')+text(280,251,'虚像比实物浅'),
    lens:()=>pair('凸透镜','凹透镜','中央厚 → 会聚','中央薄 → 发散')+arrow(80,207,210,207)+arrow(350,207,480,207)+text(280,245,'比较同样的平行入射光','#5a6c75',18),
    focus:()=>line(30,135,530,135,'#9db2be',true)+lensShape()+arrow(30,65,280,65)+arrow(280,65,420,135)+arrow(30,205,280,205)+arrow(280,205,420,135)+text(280,158,'O')+text(420,160,'F')+text(140,160,'F')+line(280,185,420,185,'#af7843')+text(350,215,'f = OF'),
    imaging:()=>'',
    'lens-lab':()=>flow(['烛焰中心','透镜光心','光屏中心'],['物距u从光心量','三中心大致同高','像距v从光心量'])+text(280,230,'物近 → 像远、像大（仅在实像范围）','#29495c',19),
    applications:()=>flow(['照相','放大投影','放大镜'],['u > 2f','f < u < 2f','u < f'])+text(280,225,'缩小实像 → 放大实像 → 放大虚像','#29495c',19),
    eye:()=>pair('近视：远物像偏前','远视：近物像偏后','凹透镜 → 向后移','凸透镜 → 向前移')+text(280,235,'目标：清晰实像落在视网膜上','#29495c',19),
    instruments:()=>flow(['远处物体','物镜成实像','目镜放大观察'],['开普勒望远镜','先缩小','增大视角'])+text(280,230,'显微镜：物镜先放大，再由目镜放大','#29495c',19),
    invisible:()=>flow(['红外线','可见光','紫外线'],['热成像、遥控','红 → 紫','荧光、消毒'])+text(280,230,'不可见 ≠ 没有能量','#af7843',22),
    temperature:()=>`<path d="M125 35v115a28 28 0 1 0 24 0V35Z" fill="#e7edf0" stroke="#6f91a5" stroke-width="3"/><path d="M137 75v92" stroke="#bf725e" stroke-width="9"/><circle cx="137" cy="177" r="17" fill="#bf725e"/>`+[-10,0,10,20].map((s,i)=>line(159,137-i*28,173,137-i*28)+text(204,144-i*28,s+' ℃','#29495c',18)).join('')+text(395,85,'测前：量程、分度值')+text(395,130,'测中：浸没、不碰底壁')+text(395,175,'读数：稳定、视线相平'),
    cooling:()=>axes('温度/℃','t / min')+line(70,45,250,95,'#af7843')+line(250,95,430,130,'#af7843')+text(91,40,'80')+text(250,83,'70')+text(430,118,'63')+text(70,221,'0')+text(250,221,'2')+text(430,221,'4'),
    evaporation:()=>flow(['提高温度','增大表面积','加快空气流动'],['其他条件相同','一次研究一个因素','表面汽化、吸热'])+text(280,230,'蒸发不要求达到沸点','#29495c',20),
    boiling:()=>axes('温度/℃')+line(70,175,260,70,'#af7843')+line(260,70,465,70,'#af7843')+text(360,52,'沸腾平台')+text(360,119,'温度不变')+text(360,153,'持续吸热')+text(220,245,'沸点与气压有关','#5a6c75',17),
    liquid:()=>flow(['气态水蒸气','遇冷液化','小水滴'],['看不见','气态 → 液态，放热','白气、雾、露']),
    melting:()=>axes('温度/℃')+line(70,175,180,115,'#af7843')+line(180,115,370,115,'#af7843')+line(370,115,470,45,'#af7843')+text(135,195,'冰')+text(277,98,'0 ℃：冰水共存')+text(430,105,'水')+text(285,155,'熔化吸热')+text(250,245,'温度不变 ≠ 不吸热','#5a6c75',18),
    sublimation:()=>pair('固态 → 气态','气态 → 固态','升华：吸热','凝华：放热')+text(280,235,'“直接”变化，不经过液态','#29495c',20),
    'water-cycle':()=>flow(['地表液态水','大气水蒸气','云中小水滴'],['蒸发吸热','遇冷液化放热','降雨、径流返回'])+arrow(465,200,95,200,'#72905c')+text(280,237,'还可能有冰晶、积雪等固态水','#5a6c75',18),
    length:()=>{let s=`<rect x="50" y="140" width="440" height="50" fill="#e9dec8"/><rect x="190" y="85" width="234.5" height="35" fill="#7ea0b4"/>`;for(let i=0;i<=60;i++){const x=50+i*7;s+=line(x,140,x,i%10?i%5?150:158:165,'#7c7460');if(i%10===0)s+=text(x,185,String(i/10),'#655d4b',16);}return s+line(190,80,190,141,'#af7843',true)+line(424.5,80,424.5,141,'#af7843',true)+text(190,65,'2.00 cm')+text(424,65,'5.35 cm')+text(280,232,'5.35 − 2.00 = 3.35 cm');},
    error:()=>flow(['3.41 cm','3.43 cm','3.42 cm'],['同一物体','规范重复测量','相同单位'])+text(280,230,'平均 = 3.42 cm；误差并未完全消失','#29495c',19),
    time:()=>flow(['20个完整来回','共32.0 s','平均1.60 s'],['同一方向起止计数','总时间','总时间 ÷ 次数']),
    speed:()=>pair('v = s / t','1 m/s = 3.6 km/h','快慢看比值','km/h → m/s：÷3.6')+text(280,235,'s = vt；t = s/v','#29495c',23),
    uniform:()=>axes('s / m')+line(70,195,430,45)+text(70,220,'0')+text(250,220,'2')+text(430,220,'4')+text(42,124,'6')+text(42,49,'12')+line(70,120,250,120,'#a5b7bf',true)+line(250,120,250,195,'#a5b7bf',true)+text(360,132,'斜率 = 3 m/s'),
    average:()=>{return `<rect x="200" y="125" width="300" height="35" fill="#d8e5ec"/><rect x="100" y="75" width="100" height="40" rx="8" fill="#bd9c74"/>`+text(150,58,'车长100 m')+text(350,190,'桥长300 m')+arrow(100,220,500,220)+text(300,250,'车头共走400 m');},
    reference:()=>`<rect x="110" y="55" width="320" height="100" rx="15" fill="#dbe8ef"/><circle cx="165" cy="167" r="16" fill="#617d8c"/><circle cx="375" cy="167" r="16" fill="#617d8c"/><circle cx="260" cy="90" r="12" fill="#af7843"/>`+text(270,137,'乘客相对车厢静止')+arrow(450,100,530,100)+line(40,190,520,190,'#8f9a7f')+text(280,230,'乘客相对地面运动')
  };
  window.GrowingPhysicsFigure=n=>{
    if(!drawings[n.figure])throw Error('缺少物理示意图：'+n.figure);
    const caption=captions[n.figure];
    if(n.figure==='imaging')return `<figure class="lesson-figure physics-figure"><div class="physics-table-wrap"><table class="physics-table"><caption>凸透镜成像分类</caption><thead><tr><th>物距</th><th>像的性质</th><th>像的位置</th></tr></thead><tbody>${[['u>2f','倒立缩小实像','另一侧，f<v<2f'],['u=2f','倒立等大实像','另一侧，v=2f'],['f<u<2f','倒立放大实像','另一侧，v>2f'],['u=f','有限距离屏上无清晰实像','特殊分界'],['u<f','正立放大虚像','与物同侧']].map(row=>'<tr>'+row.map(s=>'<td>'+esc(s)+'</td>').join('')+'</tr>').join('')}</tbody></table></div><figcaption>${esc(caption)}</figcaption></figure>`;
    const svg=drawings[n.figure]().replace(/<(path|rect|circle|text|polygon)\b([^>]*)>/g,(_,tag,attrs)=>{
      const styles=['stroke:none','fill:none'];
      for(const prop of ['stroke','stroke-width','fill','fill-opacity','font-size']){const match=attrs.match(new RegExp('(?:^|\\s)'+prop+'="([^"]+)"'));if(match)styles.push(prop+':'+match[1]+(prop==='font-size'?'px':''));}
      return '<'+tag+attrs.replace(/\/$/,'')+' style="'+styles.join(';')+'"'+(attrs.endsWith('/')?'/':'')+'>';
    });
    return `<figure class="lesson-figure physics-figure"><svg viewBox="0 0 560 270" role="img" aria-labelledby="figure-${n.id}" xmlns="http://www.w3.org/2000/svg"><title id="figure-${n.id}">${esc(n.title+'：'+caption)}</title>${svg}</svg><figcaption>${esc(caption)}</figcaption></figure>`;
  };
})();
