(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingGeometryGuidance=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Reviewed teaching explanations, never assessment or mastery state.
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=n=>Math.round(n*1000)/1000;
  function drawing(points,edges,active,note,areas,rights){
    let body=(areas||[]).map(names=>'<polygon points="'+names.map(n=>points[n].slice(0,2).map(num).join(',')).join(' ')+'" fill="#0f766e" fill-opacity=".10"/>').join('');
    body+=edges.map(e=>{const [name,a,b,dash]=e,p=points[a],q=points[b];return '<line data-part="'+name+'" x1="'+num(p[0])+'" y1="'+num(p[1])+'" x2="'+num(q[0])+'" y2="'+num(q[1])+'" stroke="'+(active.includes(name)?'#0f766e':'#64748b')+'" stroke-width="'+(active.includes(name)?3.5:2)+'"'+(dash?' stroke-dasharray="6 4"':'')+'/>';}).join('');
    body+=(rights||[]).map(([a,f,b])=>{const p=points[f],u=points[a],v=points[b],du=Math.hypot(u[0]-p[0],u[1]-p[1]),dv=Math.hypot(v[0]-p[0],v[1]-p[1]),x=(u[0]-p[0])/du*7,y=(u[1]-p[1])/du*7,z=(v[0]-p[0])/dv*7,w=(v[1]-p[1])/dv*7;return '<path data-part="right-'+f+'" d="M'+num(p[0]+x)+' '+num(p[1]+y)+' L'+num(p[0]+x+z)+' '+num(p[1]+y+w)+' L'+num(p[0]+z)+' '+num(p[1]+w)+'" fill="none" stroke="#64748b" stroke-width="1.3"/>';}).join('');
    body+=Object.keys(points).map(name=>{const p=points[name];return '<circle data-point="'+name+'" cx="'+num(p[0])+'" cy="'+num(p[1])+'" r="3" fill="#334155"/><text x="'+num(p[0]+(p[2]===undefined?8:p[2]))+'" y="'+num(p[1]+(p[3]===undefined?-8:p[3]))+'">'+escape(name)+'</text>';}).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" role="img" aria-label="'+escape(note)+'"><title>'+escape(note)+'</title><g font-family="system-ui,sans-serif" font-size="16" fill="#334155" stroke-linecap="round">'+body+'<text x="180" y="250" text-anchor="middle" font-size="13">'+escape(note)+'</text></g></svg>';
  }
  const line=(name,a,b,dash)=>[name,a,b,!!dash];
  function triangle(stage,kind){
    const pb=kind==='perp',p={A:[180,35,8,-10],B:[105,215,-20,5],C:[255,215,8,5],D:[180,215,-5,20]};
    const edges=[line('AB','A','B'),line('AC','A','C'),line('BD','B','D'),line('DC','D','C')];
    if(pb){p.P=[180,130,10,0];edges.push(line('AD','A','D'));if(stage>=2)edges.push(line('PB','P','B'),line('PC','P','C'));}
    else if(stage>=2){delete p.D;p.E=[180,215,-5,20];edges.splice(2,2,line('BE','B','E'),line('EC','E','C'));edges.push(line('AE','A','E',true));}
    const notes=pb?['AB=AC=13；BD=DC=5','A 到 B、C 等距；D 是中点','AD 是 BC 的垂直平分线','P 在 AD 上，所以 PB=PC','周长 = PB+PC+10 = 2PB+10']:['AB=AC；BD=DC','HL 先需要两个直角三角形','作 AE⊥BC；E 与 D 的关系待证','斜边 AB=AC；直角边 AE 公共','由 BE=CE 得 E=D，故 AD⊥BC'];
    const active=pb?(stage<2?['AB','AC']:stage===2?['AD']:['PB','PC']):(stage<2?['AB','AC']:stage===2?['AE']:stage===3?['AB','AC','AE']:['BE','EC','AE']);
    const svg=drawing(p,edges,active,notes[stage],!pb&&stage===3?[['A','B','E'],['A','C','E']]:[],stage>=2?[[ 'A',pb?'D':'E','C']]:[]);
    return !pb&&stage===4?svg.replace('>E</text>','>E(D)</text>'):svg;
  }
  function angleHL(stage){
    const p={O:[45,130,-20,5],A:[300,30,8,0],B:[300,230,8,0],P:[225,130,8,-8]};
    const t=180*255/(255*255+100*100);
    p.E=[45+255*t,130-100*t,-10,-12];p.F=[45+255*t,130+100*t,-10,22];
    const edges=[line('OA','O','A'),line('OB','O','B'),line('PE','P','E'),line('PF','P','F')];if(stage>=2)edges.push(line('OP','O','P',true));
    const notes=['PE⊥OA；PF⊥OB；PE=PF','目标：O 处两角相等','连接 OP，得到两个直角三角形','OP 是公共斜边；PE=PF','∠EOP=∠POF，OP 平分原角'];
    return drawing(p,edges,stage<2?['PE','PF']:stage===2?['OP']:stage===3?['OP','PE','PF']:['OA','OP','OB'],notes[stage],stage===3?[['O','E','P'],['O','F','P']]:[],[['O','E','P'],['O','F','P']]);
  }
  function perimeter(stage){
    const b=Math.sqrt(28),k=22-b,c=(k*k-36)/(2*k),x=4/b;
    const p={A:[145,82,-6,-14],B:[145-18*b,190,-18,16],C:[145+18*c,190,8,16],P:[145+18*x,190,-5,22],M:[145-9*b,136,-18,-7]};
    // PM is perpendicular to AB; the diagram also satisfies AB=8 and AC+BC=22.
    const edges=[line('AB','A','B'),line('AC','A','C'),line('BP','B','P'),line('PC','P','C'),line('PM','P','M',true)];
    if(stage>=2)edges.push(line('PA','P','A'));
    const notes=['PM 为 AB 的垂直平分线','P 到 A、B 的距离可以互换','连接 PA，得 PA=PB','PA+PC=BC；BC+AC=22','AB = 30−22 = 8'];
    return drawing(p,edges,stage<2?['PM']:stage===2?['PA','BP']:stage===3?['BP','PC','AC']:['AB'],notes[stage],[],[['P','M','A']]);
  }
  function incenter(stage){
    const p={A:[60,35,-18,-8],B:[60,215,-20,5],C:[300,215,8,5],I:[120,155,8,2]};
    const edges=[line('AB','A','B'),line('AC','A','C'),line('BC','B','C'),line('AI','A','I'),line('BI','B','I')];
    if(stage>=2){p.E=[60,155,-20,5];p.F=[156,107,8,-5];p.G=[120,215,-5,16];edges.push(line('IE','I','E',true),line('IF','I','F',true),line('IG','I','G',true));}
    if(stage>=4)edges.push(line('CI','C','I',true));
    const notes=['AI、BI 分别平分 A、B 的内角','同一个 d1，联系另外两个垂距','IE⊥AB；IF⊥AC；IG⊥BC','IE=IF=IG=4','I 在∠C 内且 IF=IG'];
    return drawing(p,edges,stage<2?['AI','BI']:stage===2?['IE','IF','IG']:stage===3?['IE','IF','IG']:['CI','IF','IG'],notes[stage],[],stage>=2?[['I','E','A'],['I','F','A'],['I','G','C']]:[]);
  }
  function area(stage){
    const theta=Math.asin(54/80)/2,c=Math.cos(theta),s=Math.sin(theta),scale=25;
    const p={A:[55,130,-20,5],B:[55+8*c*scale,130-8*s*scale,12,-5],C:[55+10*c*scale,130+10*s*scale,7,10],D:[55+3/s*scale,130,10,4]};
    const edges=[line('AB','A','B'),line('AC','A','C'),line('BD','B','D'),line('DC','D','C'),line('AD','A','D')];
    if(stage>=2){const foot=3*c/s;p.E=[55+foot*c*scale,130-foot*s*scale,-10,-13];p.F=[55+foot*c*scale,130+foot*s*scale,-10,23];edges.push(line('DE','D','E',true),line('DF','D','F',true));}
    const notes=['AB=8；AC=10；AD 平分∠A','沿 AD 分成两块，分别选择底和高','DE⊥AB；DF⊥AC；DE=DF=3','两块面积为 8×3÷2 与 10×3÷2','总面积 = 12+15 = 27 平方厘米'];
    return drawing(p,edges,stage<2?['AD']:stage===2?['DE','DF']:['AB','AC','DE','DF'],notes[stage],stage>=3?[['A','B','D'],['A','C','D']]:[],stage>=2?[['D','E','A'],['D','F','A']]:[]);
  }
  const entries={};
  function add(node,n,prompt,draw,hints,steps){
    const id=node+'-application-'+n;
    entries[id]={prompt,data:{id,svg:draw(0),hints:hints.map((text,i)=>({text,svg:draw(i===0?1:i===1?1:2)})),steps:steps.map((s,i)=>({title:s[0],text:s[1],why:{goal:s[2],noticed:s[3],reason:s[4]},svg:draw(Math.min(i+2,4))}))}};
  }
  add('cong-hl',9,'△ABC中AB=AC，D为BC中点。只用HL证明AD⊥BC：请从A向BC作垂线AE，E在BC所在直线上。',s=>triangle(s,'hl'),[
    '目标是证明垂直，但已知只给等腰和中点。HL 能直接用于没有直角条件的三角形吗？',
    '先构造两个直角三角形：让 AB、AC 成为它们的斜边，再找一条公共直角边。',
    '从 A 向 BC 作垂线 AE。比较 Rt△AEB 与 Rt△AEC；暂时不能把 E 当作 D。'
  ],[
    ['先作垂线，创造 HL 条件','从 A 向 BC 所在直线作 AE⊥BC，垂足为 E；此时 E 与 D 是否重合还要证明。','把待证明的垂直转化为可以使用 HL 的直角条件。','AB=AC 可作斜边条件，但原题没有给 AD⊥BC。','另作确定垂直的 AE，不预设 AD 是高；两个小三角形就都有直角。'],
    ['用 HL 得到底边两段相等','Rt△AEB 与 Rt△AEC 中，AB=AC，AE=AE，所以两三角形全等（HL），得 BE=CE。','证明新垂足 E 也具有中点的等距特征。','两个直角三角形的斜边 AB、AC 相等，直角边 AE 公共。','这恰好满足 HL 的斜边与一条直角边条件；对应边 BE、CE 因而相等。'],
    ['利用中点唯一性回到 AD','E 在 BC 所在直线上且 BE=CE，因此 E 是 BC 中点。D 也是中点，故 E=D，AD⊥BC。','把辅助垂线 AE 与原来要证明的 AD 联系起来。','D 是已知中点，而全等已经证明 E 到 B、C 等距。','直线上到两个不同端点等距的点只有中点，所以两个点重合，AE 就是 AD。']
  ]);
  add('cong-hl',10,'P在∠AOB内部，PE⊥OA、PF⊥OB（垂足E、F在射线上），PE=PF。用HL证明OP平分∠AOB。',angleHL,[
    '要证明 OP 平分角，需要证明 O 处哪两个角相等？',
    'PE、PF 是已知相等的直角边。连接 OP 后，哪条边是两个直角三角形的共同斜边？',
    '连接 OP，比较 Rt△OEP 与 Rt△OFP：OP 公共，PE=PF，可以用 HL。'
  ],[
    ['连接 OP，找到要比较的两角','连接 OP。∠OEP=∠OFP=90°，要证的两个角是∠EOP 与∠POF。','把角平分的目标放进两个可以比较的直角三角形。','E、F 在角的两边上，PE、PF 分别垂直两边。','连接顶点与 P 后，每侧都构成一个直角三角形，O 处的角就是目标角。'],
    ['核对 HL 的两种边','Rt△OEP 与 Rt△OFP 中，OP 是公共斜边，PE=PF 是一对直角边，故△OEP≌△OFP（HL）。','建立全等，从对应角取得所需的等角关系。','直角分别在 E、F，对面的 OP 才是斜边；PE、PF 已知相等。','HL 必须同时核对直角、斜边和一条直角边，不能把 PE、PF 当成斜边。'],
    ['由对应角相等说明平分','由全等得∠EOP=∠POF。E、F 在射线 OA、OB 上且 P 在角内，所以 OP 平分∠AOB。','把小三角形中的等角翻译回原角的平分关系。','∠EOP 就是∠AOP，∠POF 就是∠POB；P 在角内部。','两侧小角相等且 OP 位于原角内部，满足内角平分线的定义。']
  ]);
  add('perp-bisector',9,'△ABC中AB=AC=13，BC=10，D为BC中点。P为线段AD上除D外任意一点。证明PB=PC，并求△PBC周长关于PB的式子。',s=>triangle(s,'perp'),[
    'AB=AC 说明 A 到哪两个端点等距？D 为中点又能说明什么？',
    '先用垂直平分线的逆性质确定 A 的位置，再利用中点 D 确定整条直线 AD。',
    'A、D 都在 BC 的垂直平分线上，AD 就是这条线。连接 PB、PC，把 P 在线上的位置转成边长关系。'
  ],[
    ['先认出 AD 是哪条线','AB=AC，故 A 在 BC 的垂直平分线上。D 为 BC 中点，也在该线上；所以直线 AD 就是 BC 的垂直平分线。','找到一条能把 P 的位置转化为 PB、PC 相等的特殊直线。','A 到 B、C 等距；D 是 BC 中点；A、D 是两个不同点。','逆性质确定 A，定义确定 D，两点确定同一直线，因而 P 所在的 AD 就是目标垂直平分线。'],
    ['再由位置推出两边相等','P 在 AD 上，故由垂直平分线性质得 PB=PC。','将已经确定的特殊位置转化为要证明的边长关系。','AD 已证是 BC 的垂直平分线，P 又在这条线上。','垂直平分线上任意一点到两个端点等距，性质恰好给出 PB=PC。'],
    ['把周长写成一个变量','△PBC 周长=PB+PC+BC=2PB+10。P≠D，保证△PBC 不退化。','将含 PB、PC 两个未知量的周长改写为只含 PB 的式子。','PC=PB 已经证明，BC=10 已知；P 在线段 AD 上但不取 D。','用相等边替换 PC 即可合并；若 P=D，三点共线，便不能称为三角形。']
  ]);
  add('perp-bisector',10,'△ABC周长为30，AB的垂直平分线与边BC交于P。△APC周长为22，求AB。',perimeter,[
    '两个周长分别包含哪些边？小三角形中的 PA 能否换成 BC 上的一段？',
    'P 在 AB 的垂直平分线上，先想到 PA=PB；又因 P 在 BC 上，可把 PB 与 PC 拼起来。',
    '连接 PA，把 PA+PC 换成 PB+PC=BC，再比较两个三角形的周长。'
  ],[
    ['连接 PA，准备等长替换','连接 PA。P 在 AB 的垂直平分线上，所以 PA=PB。','把小三角形周长中的内部线段转换为大三角形边上的线段。','小三角形含 PA，大三角形含 BC；P 同时在线段 BC 和 AB 的垂直平分线上。','垂直平分线性质给出 PA=PB，而 PB 正好是 BC 的一部分，便于下一步拼接。'],
    ['把小三角形周长拼回外边','PA+PC+AC=22，代入 PA=PB，得 PB+PC+AC=BC+AC=22。','找出两个周长共同的一部分，避免分别求每条边。','P 在边 BC 上，所以 PB+PC=BC；PA 已经可以替换成 PB。','先等长替换、再利用线段相加，小三角形周长就变成大三角形的两条边之和。'],
    ['用周长差求剩下的一边','AB+BC+AC=30，BC+AC=22，因此 AB=30−22=8。','从总周长中扣除已知两边之和，单独得到 AB。','两个式子都含完全相同的 BC+AC。','相减会消去无需知道具体长度的 BC、AC，直接留下所求的 AB。']
  ]);
  add('angle-bisector',9,'三角形ABC中，I为A、B两内角平分线交点。I到AB、AC、BC的垂距分别为d1、d2、d3。已知d1=4，求其余两个垂距，并说明I是否在C的内角平分线上。',incenter,[
    'I 在 A 的角平分线上时，哪两个垂距相等？在 B 的角平分线上时，又是哪两个？',
    'd1 同时对应 A、B 两个角的一条边 AB，可以把另外两个垂距联系起来。',
    '作 IE⊥AB、IF⊥AC、IG⊥BC。先得 IE=IF、IE=IG，再检查角 C 的内角位置和逆性质。'
  ],[
    ['把三个距离画成垂线段','作 IE⊥AB、IF⊥AC、IG⊥BC，则 IE=d1=4、IF=d2、IG=d3。','明确每个距离对应的角边，避免把任意连线当成距离。','d1、d2、d3 分别指向 AB、AC、BC 三条边的垂距。','点到直线的距离必须由垂线段表示，画出三个垂足后才能逐个应用角平分线性质。'],
    ['两次性质共享同一个垂距','I 在 A 的内角平分线上，IE=IF；I 在 B 的内角平分线上，IE=IG。因此 d2=d3=4。','利用已知 d1 求出另外两个垂距。','A 的两边是 AB、AC，B 的两边是 BA、BC；两次都涉及到 AB 的距离 IE。','分别套用性质时，IE 是共同桥梁，因此 IF、IG 都等于已知的 4。'],
    ['检查角内条件，再用逆性质','I 是 A、B 两内角平分线在三角形内部的交点，因此位于∠C 内；又 IF=IG，所以 I 在 C 的内角平分线上。','把到 CA、CB 的等距关系转成 C 的角平分线位置。','IF 与 IG 分别垂直 CA、CB，且已证明相等；I 位于三角形内部。','角内一点到两边等距，才可用内角平分线的逆性质；核对位置可排除外角平分线。']
  ]);
  add('angle-bisector',10,'三角形ABC中，AD平分∠A，D在BC上，D到AB、AC垂距都是3厘米；AB=8厘米、AC=10厘米。求△ABC面积。',area,[
    '面积需要底和对应的高。已知 3 是 D 到哪些边的高，能直接当成 A 到 BC 的高吗？',
    '用 AD 把大三角形分成两块，分别以 AB、AC 为底，就能用上两个已知垂距。',
    '作 DE⊥AB、DF⊥AC，DE=DF=3。分别算△ABD 与△ACD 的面积后相加。'
  ],[
    ['补出与已知底对应的高','作 DE⊥AB、DF⊥AC。以 AB、AC 为两块三角形的底，则对应高都是 3 厘米。','让已知的边长 8、10 与已知垂距 3 正确配对。','3 是 D 到 AB、AC 的距离；题中没有给 A 到 BC 的高。','选择底边时应优先选已有对应高的 AB、AC，不能直接把 3 当作整个三角形对 BC 的高。'],
    ['分块计算两部分面积','S△ABD=8×3÷2=12；S△ACD=10×3÷2=15（平方厘米）。','用底乘高除以 2 计算两块可直接求出的面积。','D 在 BC 上，AD 将△ABC 分成△ABD、△ACD，两块各有明确的底与高。','两块的底不同但对应高相等，可以分别代入公式，不需要先求 BC 的长度。'],
    ['利用无重叠分割相加','S△ABC=S△ABD+S△ACD=12+15=27 平方厘米。','将两个局部面积还原为题目要求的总面积。','D 在边 BC 上，两个小三角形共边 AD，内部没有重叠且覆盖整个△ABC。','这种沿边上点连线的分割允许面积直接相加；答案应使用平方厘米。']
  ]);
  return {get:function(q){const e=q&&entries[q.id];return e&&q.prompt===e.prompt?e.data:null;}};
});
