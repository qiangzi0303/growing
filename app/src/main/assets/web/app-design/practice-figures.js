/* Question-specific, local SVG diagrams. Never infer a diagram from arbitrary student text. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingPracticeFigures=factory();})(globalThis,()=>{
 'use strict';
 const bank=Object.create(null),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
 const line=(a,b,dash=false)=>`<path d="M${a}L${b}" fill="none"${dash?' stroke-dasharray="5 5"':''}/>`;
 const poly=(ps,close=false)=>`<path d="M${ps.join('L')}${close?'Z':''}" fill="none"/>`;
 const text=(x,y,s,size=15)=>`<text x="${x}" y="${y}" fill="#243d32" stroke="none" font-size="${size}" text-anchor="middle">${esc(s).replace(/√(\d+)/g,'√<tspan text-decoration="overline">$1</tspan>')}</text>`;
 const dot=(p,r=3)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="#426957"/>`;
 const label=(p,s,dx=0,dy=-10)=>dot(p)+text(p[0]+dx,p[1]+dy,s);
 const arrow=(a,b,dash=false)=>{const t=Math.atan2(b[1]-a[1],b[0]-a[0]),k=8;return line(a,b,dash)+poly([[b[0]-k*Math.cos(t-.45),b[1]-k*Math.sin(t-.45)],b,[b[0]-k*Math.cos(t+.45),b[1]-k*Math.sin(t+.45)]]);};
 const tick=(a,b)=>{const m=mid(a,b),d=Math.hypot(b[0]-a[0],b[1]-a[1]),x=-(b[1]-a[1])/d*5,y=(b[0]-a[0])/d*5;return line([m[0]-x,m[1]-y],[m[0]+x,m[1]+y]);};
 const right=(p,a,b)=>{const u=[a[0]-p[0],a[1]-p[1]],v=[b[0]-p[0],b[1]-p[1]],ul=Math.hypot(...u),vl=Math.hypot(...v),q=[p[0]+u[0]/ul*12,p[1]+u[1]/ul*12],r=[p[0]+v[0]/vl*12,p[1]+v[1]/vl*12];return poly([q,[q[0]+r[0]-p[0],q[1]+r[1]-p[1]],r]);};
 const foot=(p,a,b)=>{const u=[b[0]-a[0],b[1]-a[1]],t=((p[0]-a[0])*u[0]+(p[1]-a[1])*u[1])/(u[0]*u[0]+u[1]*u[1]);return [a[0]+t*u[0],a[1]+t*u[1]];};
 const points=(ps,names)=>ps.map((p,i)=>label(p,names[i],i===1?-13:i===2?13:0,i===1||i===2?20:-10)).join('');
 const triangle=(a=[170,45],b=[60,220],c=[350,220],names='ABC')=>poly([a,b,c],true)+points([a,b,c],names);
 const quad=(ps,names='ABCD')=>poly(ps,true)+ps.map((p,i)=>label(p,names[i],i===0||i===3?-13:13,i<2?-10:20)).join('');
 const note=s=>text(220,292,s,13);
 const dim=(a,b,s)=>line(a,b)+line([a[0],a[1]-5],[a[0],a[1]+5])+line([b[0],b[1]-5],[b[0],b[1]+5])+text((a[0]+b[0])/2,(a[1]+b[1])/2+20,s);
 function add(topic,n,description,draw){const id=topic+'-application-'+n;if(bank[id])throw Error('Duplicate diagram '+id);bank[id]={description,draw};}
 const A=[170,45],B=[60,220],C=[350,220],D=[205,220];
 const basic=extras=>triangle()+(extras||'');
 const median=extras=>basic(line(A,D)+label(D,'D',0,20)+tick(B,D)+tick(D,C)+(extras||''));
 const iso=extras=>triangle([220,40],[80,220],[360,220])+line([220,40],[220,220])+label([220,220],'D',0,20)+tick([220,40],[80,220])+tick([220,40],[360,220])+(extras||'');
 function rectangle(top,side,inside='',isSquare=false){const ps=isSquare?[[125,55],[315,55],[315,245],[125,245]]:[[80,75],[360,75],[360,225],[80,225]];return quad(ps)+text(220,40,top)+text(isSquare?365:394,155,side,13)+text(220,155,inside);}
 function axes(xmin,xmax,ymin,ymax){const p=(x,y)=>[55+(x-xmin)/(xmax-xmin)*330,245-(y-ymin)/(ymax-ymin)*205],o=p(0,0);return {p,g:arrow(p(xmin,0),p(xmax,0))+arrow(p(0,ymin),p(0,ymax))+text(405,o[1]+5,'x')+text(o[0]-13,28,'y')+text(o[0]-12,o[1]+17,'O',12)};}
 function coords(xr,yr,draw){const a=axes(...xr,...yr);return a.g+draw(a.p);}
 function graph(description,lines,ps=[],ranges=[[-2,8],[-5,10]]){return coords(...ranges,p=>lines.map(([a,b,s],i)=>{const t=s==='y=4x+20'?.45:lines.length===1?.5:i===0?.75:.25,l=p(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);return line(p(...a),p(...b))+text(l[0],l[1]-12,s,12);}).join('')+ps.map(([x,y,s])=>label(p(x,y),s,0,-12)).join('')+note(description));}
 function box(x,y,w,h,s){const chars=Array.from(String(s)),n=Math.max(1,Math.floor((w-10)/13)),rows=[];for(let i=0;i<chars.length;i+=n)rows.push(chars.slice(i,i+n).join(''));return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#f5f8f2"/>`+rows.map((row,i)=>text(x+w/2,y+h/2+5+(i-(rows.length-1)/2)*17,row,13)).join('');}
 function flow(labels){const step=410/labels.length,w=step-20;return labels.map((s,i)=>box(20+i*step,115,w,70,s)+(i<labels.length-1?arrow([22+i*step+w,150],[15+(i+1)*step,150]):'')).join('');}
 add('tri-lines',9,'AD为中线，BC=16厘米、AD=10厘米、AB=13厘米，没有垂直条件',()=>{
  const a=[221.25,255-Math.sqrt(200**2-6.25**2)],b=[55,255],c=[375,255],d=[215,255];
  return triangle(a,b,c)+line(a,d)+label(d,'D',0,20)+tick(b,d)+tick(d,c)+text(112,145,'13 cm')+text(268,155,'10 cm')+text(215,303,'BC = 16 cm');
 });
 add('tri-lines',10,'AD为中线，AE为高，BC=20厘米、AE=9厘米',()=>median(line(A,[170,220],true)+label([170,220],'E',-10,20)+right([170,220],A,C)+text(150,145,'9 cm')+dim([60,254],[350,254],'BC = 20 cm')));
 add('tri-angles',9,'B处外角125度，A比C大15度',()=>basic(line([10,220],B)+text(53,195,'125°')+text(280,90,'∠A = ∠C + 15°')));
 add('tri-angles',10,'A角50度，AD为角平分线，ADB角110度',()=>basic(line(A,[239,220])+label([239,220],'D',0,20)+text(310,65,'∠A=50°')+text(218,196,'110°')+note('∠BAD = ∠DAC')));
 add('tri-inequality',9,'两根木条分别3厘米与8厘米，第三根长度待定',()=>line([65,70],[155,70])+text(110,53,'3 cm')+line([65,145],[305,145])+text(185,128,'8 cm')+line([65,220],[245,220])+text(155,203,'整数厘米，长度待定'));
 add('tri-inequality',10,'等腰三角形周长26厘米，整数底边长于腰',()=>triangle([220,100],[45,220],[395,220])+text(103,145,'腰 a')+text(337,145,'腰 a')+text(220,252,'底边 b（整数，b > a）')+note('2a + b = 26 cm'));
 add('congruence',9,'ABC与FED全等，已知对应边与AC长',()=>triangle([123,81.92],[45,210],[145,210])+triangle([338,81.92],[260,210],[360,210],'FED')+text(55,135,'2x+3',12)+text(95,250,'3y−2',12)+text(158,130,'13')+text(275,135,'15')+text(310,250,'10')+note('△ABC ≌ △FED'));
 add('congruence',10,'ABC与BDA全等，共用AB，AC=AB=7、BC=9',()=>{
  const a=[110,140],b=[290,140],c=[141.22,317.27],d=[258.78,-37.27],shrink=p=>[200+(p[0]-200)*.65,140+(p[1]-140)*.65];
  return triangle(shrink(a),shrink(b),shrink(c))+poly([shrink(b),shrink(d),shrink(a)],true)+label(shrink(d),'D')+text(200,127,'AB=7')+text(99,206,'AC=7')+text(280,220,'BC=9')+note('△ABC ≌ △BDA；对应顺序以题干为准');
 });
 add('cong-sss',9,'凸四边形AB=AD、CB=CD，连接AC',()=>quad([[220,35],[365,145],[220,245],[75,145]])+line([220,35],[220,245])+note('AB = AD，CB = CD'));
 add('cong-sss',10,'A与B在CD两侧，AC=AD=5、BC=BD=8、CD=6',()=>poly([[220,45],[130,145],[220,245],[310,145]],true)+line([130,145],[310,145])+line([220,45],[220,245])+label([220,45],'A')+label([220,245],'B',0,20)+label([130,145],'C',-15,0)+label([310,145],'D',15,0)+text(140,84,'5')+text(300,84,'5')+text(140,217,'8')+text(300,217,'8')+text(220,137,'6'));
 add('cong-sas',9,'AB=AC，D为BC中点，中线AD',()=>iso(note('AB = AC，BD = DC')));
 add('cong-sas',10,'AB与CD交于O，AO=BO、CO=DO',()=>line([65,55],[375,245])+line([80,230],[360,70])+line([65,55],[80,230])+line([375,245],[360,70])+label([65,55],'A')+label([375,245],'B',10,18)+label([80,230],'C',-10,18)+label([360,70],'D')+label([220,150],'O',0,22)+note('AO = BO，CO = DO'));
 add('cong-asa',9,'两三角形对应角45度、75度，对应边BC=EF=8',()=>triangle([90,50],[35,215],[180,215])+triangle([305,50],[250,215],[395,215],'DEF')+text(90,82,'45°')+text(65,198,'75°')+text(110,250,'8')+text(305,82,'45°')+text(280,198,'75°')+text(325,250,'8'));
 add('cong-asa',10,'AD、BC交于O，AB平行CD，AO=DO',()=>line([70,60],[370,240])+line([70,240],[370,60])+line([70,60],[370,60])+line([70,240],[370,240])+points([[70,60],[370,60],[70,240],[370,240]],'ABCD')+label([220,150],'O',0,23)+note('AB ∥ CD，AO = DO'));
 add('cong-hl',9,'AB=AC，D为中点，作垂线AE；D与E是否重合待证明',()=>triangle([220,45],[75,220],[365,220])+line([220,45],[220,220],true)+right([220,220],[220,45],[365,220])+text(220,247,'D、E（重合关系待证）')+note('AB = AC；D为中点，E为垂足'));
 add('cong-hl',10,'P在AOB内部，PE与PF分别垂直两边，PE=PF',()=>{
  const o=[65,240],a=[375,240],b=[265,40],p=[255,161],e=foot(p,o,a),f=foot(p,o,b);
  return line(o,a)+line(o,b)+line(o,p)+line(p,e,true)+line(p,f,true)+right(e,o,p)+right(f,o,p)+label(o,'O',-12,18)+label(a,'A',12,12)+label(b,'B')+label(p,'P',15,-7)+label(e,'E',0,20)+label(f,'F',-12,-8)+note('PE = PF');
 });
 add('perp-bisector',9,'AB=AC=13、BC=10，D中点，P在线段AD上',()=>iso(line([220,135],[80,220])+line([220,135],[360,220])+label([220,135],'P',15,0)+text(125,115,'13')+text(315,115,'13')+text(290,250,'BC = 10')));
 add('perp-bisector',10,'AB的垂直平分线交BC于P，连接AP',()=>{
  const a=[120,50],b=[40,230],c=[380,230],p=[282.5,230],m=mid(a,b);
  return triangle(a,b,c)+line(a,p)+line(m,p,true)+label(m,'M',-16,-6)+label(p,'P',0,20)+right(m,a,p)+tick(a,m)+tick(m,b)+note('M为AB中点，PM ⟂ AB');
 });
 add('angle-bisector',9,'I为A、B角平分线交点，到三边垂距d1=4、d2、d3',()=>{
  const a=[220,35],b=[65,225],c=[375,225],i=[220,151.4],l=foot(i,a,b),r=foot(i,a,c),e=foot(i,b,c);
  return triangle(a,b,c)+line(a,i)+line(b,i)+line(i,l,true)+line(i,r,true)+line(i,e,true)+right(l,a,i)+right(r,a,i)+right(e,b,i)+label(i,'I',15,5)+text(164,146,'d₁=4',12)+text(278,146,'d₂',12)+text(240,197,'d₃',12);
 });
 add('angle-bisector',10,'AD平分A角，D到AB、AC垂距3，AB=8、AC=10',()=>{
  const a=[220,35],b=[80,195],c=[395,235],d=[220,212.78],e=foot(d,a,b),f=foot(d,a,c);
  return triangle(a,b,c)+line(a,d)+line(d,e,true)+line(d,f,true)+right(e,a,d)+right(f,a,d)+label(d,'D',0,22)+text(110,105,'8 cm')+text(345,105,'10 cm')+text(156,181,'3 cm')+text(285,181,'3 cm')+note('∠BAD = ∠DAC');
 });
 add('isosceles',9,'等腰三角形周长34，腰比底边长2',()=>triangle([220,40],[80,220],[360,220])+tick([220,40],[80,220])+tick([220,40],[360,220])+text(111,120,'a + 2')+text(329,120,'a + 2')+text(220,252,'底边 a')+note('周长 = 34'));
 add('isosceles',10,'AB=AC=15、BC=18，D为中点',()=>iso(text(120,120,'15')+text(320,120,'15')+text(290,250,'BC = 18')));
 add('equilateral',9,'边长12的等边三角形，D、E为BC、AC中点',()=>triangle([220,35],[110,225],[330,225])+line([220,35],[220,225])+label([220,225],'D',0,20)+label([275,130],'E',16,0)+tick([110,225],[220,225])+tick([220,225],[330,225])+note('AB=BC=CA=12；E为AC中点'));
 add('equilateral',10,'AB=AC、B角60度、周长27',()=>triangle([220,35],[110,225],[330,225])+text(145,207,'60°')+tick([220,35],[110,225])+tick([220,35],[330,225])+note('AB = AC；周长 = 27'));
 add('square-root',9,'正方形面积72平方厘米，边长待求',()=>rectangle('正方形','边长？','S = 72 cm²',true));
 add('root-estimate',10,'正方形地毯面积50平方米，边长与7.1米比较',()=>rectangle('正方形地毯','边长？','S = 50 m²',true)+note('门框允许最大边长7.1 m'));
 add('cube-root',9,'正方体体积0.343立方米，棱长待求',()=>quad([[100,95],[280,95],[280,245],[100,245]])+poly([[100,95],[165,45],[345,45],[280,95]])+poly([[345,45],[345,195],[280,245]])+line([165,45],[165,195],true)+line([165,195],[100,245],true)+line([165,195],[345,195],true)+text(195,172,'V = 0.343 m³')+text(320,135,'a ?'));
 function numberLine(ps){return arrow([30,160],[410,160])+ps.map(([x,s,y=190])=>line([x,154],[x,166])+text(x,y,s)).join('')+text(411,145,'x');}
 add('real-line',9,'A表示负根号7，B表示3的数轴',()=>numberLine([[80,'A: −√7',215],[120,'−2'],[220,'0'],[370,'B: 3']])+line([80,115],[370,115])+text(225,101,'AB ?'));
 add('real-line',10,'数轴A负4、B6，P在AB间且PA=2PB',()=>numberLine([[60,'A: −4'],[260,'P: ?'],[360,'B: 6']])+note('PA = 2PB'));
 add('pythagoras',9,'斜边13的直角三角形，两直角边相差7',()=>triangle([100,55],[100,225],[340,225])+right([100,225],[100,55],[340,225])+text(230,127,'13')+text(65,150,'x')+text(220,255,'x + 7'));
 add('pythagoras',10,'C是直角，AC9、BC12，CD是斜边AB上的高',()=>{
  const a=[70,55],b=[350,245],c=[70,245],d=foot(c,a,b);return triangle(a,b,c)+right(c,a,b)+line(c,d,true)+right(d,a,c)+label(d,'D',15,-8)+text(40,150,'9')+text(210,275,'12');
 });
 add('pyth-converse',9,'三边x、x加7、x加8，最长边所对角是直角',()=>triangle([80,50],[80,220],[350,220])+right([80,220],[80,50],[350,220])+text(45,140,'x')+text(220,250,'x + 7')+text(250,125,'x + 8'));
 add('pyth-converse',10,'0.9、1.2、1.5米木条组成三角框，直角待判断',()=>triangle([100,55],[100,220],[320,220])+text(65,140,'0.9 m')+text(215,252,'1.2 m')+text(255,120,'1.5 m'));
 add('pyth-apply',9,'13米梯子靠墙，初始梯脚距墙5米，向外移7米',()=>line([70,30],[70,235])+line([70,235],[380,235])+line([70,55],[170,235])+line([70,160],[310,235],true)+right([70,235],[70,30],[380,235])+text(112,145,'13 m')+text(112,257,'5 m')+arrow([180,252],[300,252])+text(240,278,'外移7 m')+text(33,100,'墙')+text(350,257,'地面'));
 add('pyth-apply',10,'80米乘60米操场，比较沿边与对角线路线',()=>rectangle('80 m','60 m')+line([80,75],[360,225],true)+arrow([80,75],[360,75])+arrow([360,75],[360,225])+note('同一顶点出发，到达对角顶点'));
 add('coordinates',9,'矩形A负2负1、B4负1、C4,3，D坐标待求',()=>coords([-3,5],[-2,4],p=>quad([p(-2,-1),p(4,-1),p(4,3),p(-2,3)])+note('A(−2,−1)，B(4,−1)，C(4,3)')));
 add('coordinates',10,'A负4,0、B2,0，C在y轴正半轴，面积15',()=>coords([-5,3],[-1,6],p=>triangle(p(0,5),p(-4,0),p(2,0),'CAB')+note('A(−4,0)，B(2,0)；C在y轴正半轴，S=15')));
 add('quadrants',9,'P位于第三象限，坐标为2t减6与t加1',()=>coords([-5,5],[-5,5],p=>label(p(-2.8,-2.5),'P',0,-12)+note('P(2t−6, t+1)；第三象限位置示意')));
 add('quadrants',10,'参数点P在坐标轴上，应分别讨论两轴',()=>coords([-4,4],[-4,4],p=>dot(p(2,0))+dot(p(0,2))+text(330,128,'可能在x轴',12)+text(280,80,'或y轴',12)+note('P(a−1, 2a+4)，位置待确定')));
 add('translation',9,'A负1,2到A撇2负2的整体平移，B3,2、C1,5',()=>coords([-2,7],[-4,6],p=>triangle(p(-1,2),p(3,2),p(1,5))+poly([p(2,-2),p(6,-2),p(4,1)],true)+label(p(2,-2),'A′',0,20)+label(p(6,-2),'B′',0,20)+label(p(4,1),'C′',12,-5)+arrow(p(-1,2),p(2,-2),true)+note('A(−1,2) → A′(2,−2)；B(3,2)，C(1,5)')));
 add('translation',10,'P右移4、下移5后落在y轴',()=>coords([-6,2],[-4,5],p=>label(p(-4,3),'P(2a,3)',0,-12)+arrow(p(-4,3),p(0,3),true)+arrow(p(0,3),p(0,-2),true)+text(210,73,'右移4')+text(350,170,'下移5')+label(p(0,-2),'P′',20,8)));
 add('reflection',9,'ABC关于y轴对称，原坐标负1,1、3,1、1,4',()=>coords([-4,4],[-1,5],p=>triangle(p(-1,1),p(3,1),p(1,4))+poly([p(1,1),p(-3,1),p(-1,4)],true)+label(p(1,1),'A′',8,20)+label(p(-3,1),'B′',0,20)+label(p(-1,4),'C′')+note('A(−1,1)，B(3,1)，C(1,4)')));
 add('reflection',10,'A负3,2、B5,2，在x轴上找P使PA加PB最小',()=>coords([-4,6],[-1,4],p=>label(p(-3,2),'A(−3,2)',0,-13)+label(p(5,2),'B(5,2)',0,-13)+label(p(.6,0),'P（位置待定）',50,25)+line(p(-3,2),p(.6,0))+line(p(.6,0),p(5,2))));
 add('line-graph',9,'直线y负3x加6与坐标轴围成三角形，截距待求',()=>graph('轴上交点坐标待求',[[[-1,9],[3,-3],'y = −3x + 6']],[[0,6,'A'],[2,0,'B']],[[-2,5],[-4,10]]));
 add('line-graph',10,'y=kx加4经过2,0，判断负1,6是否在直线上',()=>graph('y = kx + 4；k待求',[[[-1,6],[4,-4],'']],[[2,0,'(2,0)'],[0,4,'(0,4)']],[[-2,5],[-5,8]]));
 add('line-coefficients',9,'一次函数过负1,5与3负3',()=>graph('解析式与x轴交点待求',[[[-2,7],[4,-5],'']],[[-1,5,'(−1,5)'],[3,-3,'(3,−3)']],[[-3,5],[-6,8]]));
 add('line-system',9,'y=2x减2与y负x加7交P，并与x轴围成三角形',()=>graph('P坐标与三角形面积待求',[[[0,-2],[5,8],'y=2x−2'],[[-1,8],[8,-1],'y=−x+7']],[[3,4,'P']],[[-2,9],[-3,10]]));
 add('line-system',10,'收费y=4x加20与y=6x，非负整数件数',()=>graph('x为非负整数件数，P坐标待求',[[[0,20],[14,76],'y=4x+20'],[[0,0],[14,84],'y=6x']],[[10,60,'P']],[[-1,16],[-5,95]]));
 add('line-monotone',10,'水箱A=100减4t、B=40加2t，适用0到20分钟',()=>graph('横轴t / min；纵轴水量 / L',[[[0,100],[20,20],'A=100−4t'],[[0,40],[20,80],'B=40+2t']],[],[[-2,22],[-5,115]]));
 add('line-model',9,'自行车甲10加3t，乙5t的费用比较',()=>graph('横轴t / h；纵轴费用 / 元',[[[0,10],[10,40],'甲：10+3t'],[[0,0],[10,50],'乙：5t']],[],[[-1,12],[-4,58]]));
 function bars(labels,values,title){const max=Math.max(...values.filter(Number.isFinite),1);return line([45,235],[410,235])+labels.map((s,i)=>{const x=65+i*330/labels.length,h=Number.isFinite(values[i])?values[i]/max*150:0,w=Math.min(40,210/labels.length);return `<rect x="${x}" y="${235-h}" width="${w}" height="${h}" fill="#e6eee7"/>`+text(x+w/2,221-h,values[i]??'?')+text(x+w/2,260,s,11);}).join('')+text(220,35,title);}
 add('charts',9,'240人社团人数球类90、艺术60、科技54，阅读待求',()=>bars(['球类','艺术','科技','阅读'],[90,60,54,null],'总人数240（扇形图待作）'));
 add('charts',10,'两班各40人，给定三种上学方式人数',()=>bars(['甲步行','甲骑车','甲乘车','乙步行','乙骑车','乙乘车'],[12,8,20,16,12,12],'人数；甲、乙班各40人'));
 add('histogram',9,'阅读时间原始数据按四个左闭右开组分组',()=>numberLine([[60,'0'],[140,'10'],[220,'20'],[300,'30'],[380,'40']])+text(220,60,'5、10、12、19、20、22、28、30、35、39',13)+text(220,105,'按左闭右开区间分组；横轴：分钟',13));
 add('histogram',10,'五组成绩对应频数6、9、15、18、12',()=>bars(['[0,60)','[60,70)','[70,80)','[80,90)','[90,100]'],[6,9,15,18,12],'各组人数（频数条形图，非直方图）'));
 const pa=[[95,70],[310,70],[355,225],[140,225]],rect=[[75,65],[365,65],[365,220],[75,220]],rh=[[220,35],[315,145],[220,255],[125,145]],sq=[[130,50],[310,50],[310,230],[130,230]];
 const diagonals=ps=>line(ps[0],ps[2])+line(ps[1],ps[3])+label(mid(ps[0],ps[2]),'O',14,14);
 add('parallelogram',9,'AB10、BC6、AC12、BD8根号2的平行四边形，对角线交O',()=>quad(pa)+diagonals(pa)+note('AB=10，BC=6，AC=12，BD=8√2 cm'));
 add('parallelogram',10,'平行四边形中E、F分别为AO、CO中点',()=>{const o=mid(pa[0],pa[2]),e=mid(pa[0],o),f=mid(pa[2],o);return quad(pa)+diagonals(pa)+label(e,'E',-7,-10)+label(f,'F',7,17)+line(pa[1],e)+line(pa[3],f)+note('AE = EO，CF = FO');});
 add('parallel-judge',9,'AB平行且等于CD，连接AC',()=>quad(pa)+line(pa[0],pa[2])+note('AB ∥ CD，AB = CD'));
 add('parallel-judge',10,'D、E为AB、AC中点，DE延长至F且EF=DE',()=>{const d=mid(A,B),e=mid(A,C),f=[2*e[0]-d[0],e[1]];return basic(line(d,f)+line(C,f)+label(d,'D',-15,0)+label(e,'E',0,-12)+label(f,'F',12,0)+note('AD=DB，AE=EC，DE=EF'));});
 add('rectangle',9,'矩形AB12、BC5，对角线交O',()=>quad(rect)+diagonals(rect)+text(220,47,'12 cm')+text(397,150,'5 cm'));
 add('rectangle',10,'矩形中E、F分别为AB、CD中点，连接EC和FA',()=>{const e=mid(rect[0],rect[1]),f=mid(rect[2],rect[3]);return quad(rect)+line(e,rect[2])+line(f,rect[0])+label(e,'E',0,-10)+label(f,'F',0,20)+note('AE = EB，CF = FD');});
 add('rhombus',9,'菱形边13厘米、对角线AC10厘米',()=>quad(rh)+diagonals(rh)+text(300,75,'13 cm')+text(188,103,'AC=10')+note('四边相等'));
 add('rhombus',10,'平行四边形AC垂直BD，AO6、BO8',()=>quad(rh)+diagonals(rh)+right([220,145],rh[0],rh[1])+text(198,95,'6')+text(270,134,'8')+note('AC ⟂ BD'));
 add('square',9,'正方形对角线10厘米，O到AB的距离待求',()=>quad(sq)+diagonals(sq)+line([220,140],[220,50],true)+right([220,50],sq[1],[220,140])+text(280,187,'AC=10 cm'));
 add('square',10,'正方形边8厘米，各边中点依次E、F、G、H',()=>{const ms=sq.map((p,i)=>mid(p,sq[(i+1)%4]));return quad(sq)+poly(ms,true)+ms.map((p,i)=>label(p,'EFGH'[i],i===1?17:i===3?-17:0,i===0?-12:i===2?20:5)).join('')+note('AB=8 cm；E、F、G、H为各边中点');});
 add('midline',9,'D、E为AB、AC中点，BC16厘米，A到BC高10厘米',()=>{const d=mid(A,B),e=mid(A,C);return basic(line(d,e)+label(d,'D',-15,-3)+label(e,'E',15,-3)+line(A,[170,220],true)+right([170,220],A,C)+text(135,177,'10 cm')+text(270,250,'BC=16 cm'));});
 add('midline',10,'四边形对角线AC12、BD16且垂直，各边中点EFGH',()=>{const ps=[[200,40],[370,145],[200,250],[50,145]],ms=ps.map((p,i)=>mid(p,ps[(i+1)%4]));return quad(ps)+line(ps[0],ps[2])+line(ps[1],ps[3])+right([200,145],ps[0],ps[1])+poly(ms,true)+ms.map((p,i)=>label(p,'EFGH'[i],i<2?12:-12,i===0||i===3?-10:20)).join('')+note('AC = 12 cm，BD = 16 cm，AC ⟂ BD');});
 add('trapezoid',9,'AB6米、CD14米、高6米，延长两腰在短底一侧交P',()=>{const ps=[[160,120],[280,120],[360,240],[80,240]];return quad(ps)+line([220,30],ps[3])+line([220,30],ps[2])+label([220,30],'P')+line([160,120],[160,240],true)+right([160,240],[160,120],[360,240])+text(220,105,'6 m')+text(220,272,'14 m')+text(134,182,'6 m');});
 add('trapezoid',10,'水渠上底10米、下底4米、高3米，水深2米',()=>poly([[55,65],[385,65],[286,230],[154,230]],true)+line([88,120],[352,120])+text(220,49,'渠口 10 m')+text(220,255,'渠底 4 m')+text(220,106,'水面宽？')+line([405,65],[405,230])+text(398,148,'3 m')+text(341,218,'水深2 m')+note('两腰均为直线'));
 add('iso-trapezoid',9,'等腰梯形上底10厘米、下底22厘米、腰10厘米',()=>quad([[150,70],[290,70],[374,220],[66,220]])+line([150,70],[150,220],true)+right([150,220],[150,70],[374,220])+text(220,52,'10 cm')+text(220,252,'22 cm')+text(90,140,'10 cm')+text(350,140,'10 cm'));
 add('iso-trapezoid',10,'等腰梯形AB8、CD18、高12，求对角线AC',()=>quad([[156,55],[284,55],[364,225],[76,225]])+line([156,55],[364,225])+line([156,55],[156,225],true)+right([156,225],[156,55],[364,225])+text(220,40,'8')+text(220,255,'18')+text(133,147,'12'));
 add('factor-concept',9,'长方形面积x平方加8x加15，一边x加3米',()=>rectangle('x + 3 m','另一边？','S = x² + 8x + 15 m²'));
 add('factor',10,'两长方形花圃宽3a，长2a与5，沿共同宽度拼接',()=>rectangle('','3a m')+text(135,48,'2a m')+text(275,48,'5 m')+line([190,75],[190,225],true)+text(135,150,'花圃①')+text(275,150,'花圃②')+note('沿共同宽度拼接；a > 0'));
 add('factor-difference',9,'边长x的正方形切去边长4米的小正方形，剩余45平方米',()=>quad([[100,45],[340,45],[340,245],[100,245]])+`<rect x="100" y="45" width="75" height="65" fill="#f6e5de" stroke-dasharray="5 4"/>`+text(140,85,'切去')+text(142,130,'4 m')+text(220,30,'x m')+text(250,175,'剩余45 m²'));
 add('factor-perfect',9,'长方形邻边相等，面积4x平方加12x加9',()=>rectangle('相邻边相等','边长？','S = 4x² + 12x + 9 m²',true));
 add('radical-simplify',10,'两个正方形，左侧面积200平方厘米，右侧边长短根号8厘米',()=>poly([[35,65],[205,65],[205,235],[35,235]],true)+poly([[265,105],[395,105],[395,235],[265,235]],true)+text(120,150,'200 cm²')+text(330,165,'S ?')+note('右侧正方形边长比左侧短 √8 cm'));
 add('radical-multiply',9,'长方形长3根号6厘米，宽2根号3厘米',()=>rectangle('3√6 cm','2√3 cm'));
 add('radical-add',9,'三角形边长根号18、根号32、根号50厘米',()=>triangle([160,65],[60,220],[360,220])+text(75,140,'√18 cm')+text(293,132,'√32 cm')+text(220,255,'√50 cm'));
 function drum(){return `<ellipse cx="180" cy="160" rx="90" ry="22" fill="#eef4e7"/>`+line([90,160],[90,220])+line([270,160],[270,220])+`<path d="M90,220 Q180,260 270,220" fill="none"/>`+line([120,90],[170,148])+dot([150,118])+dot([195,111])+dot([230,125])+text(308,122,'纸屑')+text(310,180,'鼓面')+text(100,73,'鼓槌');}
 add('phy-source',9,'音叉振动使悬挂的轻小球弹开',()=>poly([[145,55],[145,155],[205,155],[205,55]])+line([175,155],[175,230])+line([290,35],[280,145])+`<circle cx="280" cy="160" r="15" fill="#f4e8cd"/>`+text(170,36,'音叉')+text(326,168,'轻小球')+arrow([219,157],[257,157])+note('小球靠近叉股，观察是否被弹开'));
 add('phy-source',10,'同一鼓与纸屑，比较轻敲和重敲时的现象',()=>drum()+note('同一鼓、相同纸屑；比较轻敲与重敲'));
 add('phy-medium',9,'玻璃罩内电铃保持工作，抽气泵逐渐抽气',()=>`<path d="M90,225 V110 A100,80 0 0 1 290,110 V225Z" fill="none"/>`+box(137,125,105,65,'工作中的电铃')+line([70,230],[310,230])+poly([[290,210],[360,210],[360,155]])+arrow([360,190],[360,155])+text(360,135,'抽气泵')+text(190,65,'密闭玻璃罩'));
 add('phy-medium',10,'长桌两端分别敲击与听音，比较耳朵贴桌和不贴桌',()=>box(45,140,340,30,'同一长桌')+arrow([80,85],[80,134])+text(80,60,'同样轻敲')+text(327,100,'①耳朵贴桌')+text(327,216,'②耳朵不贴桌')+note('同一人、相同敲击位置与力度'));
 add('phy-echo',9,'人在两平行峭壁间，首次回声往返0.8秒和1.2秒',()=>line([55,40],[55,240])+line([385,40],[385,240])+label([200,150],'人',0,25)+arrow([190,120],[65,120])+arrow([65,160],[185,160])+arrow([215,120],[375,120])+arrow([375,160],[215,160])+text(115,90,'往返0.8 s')+text(305,90,'往返1.2 s')+note('声速340 m/s；两段均为往返时间'));
 add('phy-echo',10,'船只声呐往返海底0.36秒，水中声速1500米每秒',()=>line([40,70],[400,70])+poly([[155,55],[285,55],[265,90],[175,90]],true)+line([40,245],[400,245])+arrow([210,95],[210,238])+arrow([240,238],[240,95])+text(310,160,'往返0.36 s')+text(330,269,'海底')+note('水中声速1500 m/s；水深待求'));
 add('phy-pitch',10,'改变钢尺伸出桌边长度，控制拨动幅度',()=>box(40,145,190,60,'桌面')+line([75,140],[360,140])+box(90,105,65,32,'压紧')+arrow([330,108],[330,134])+text(310,82,'拨动钢尺')+dim([230,215],[360,215],'伸出长度可变'));
 add('phy-loudness',9,'鼓与纸屑研究响度和振幅',()=>drum()+note('控制鼓、纸屑、听音距离；改变敲击力度'));
 add('phy-noise',9,'施工点、传播路径与学校听者的三个降噪位置',()=>flow(['施工点','传播路径','学校内听者'])+note('分别在三个位置设计降噪措施'));
 function mirror(){return line([220,35],[220,245])+Array.from({length:14},(_,i)=>line([220,40+i*15],[230,31+i*15])).join('');}
 function object(x,y=220,h=100,s='物'){return arrow([x,y],[x,y-h])+text(x,y+24,s);}
 function mirrorScene(distance){return mirror()+object(95,220,115,'物')+arrow([345,220],[345,105],true)+text(345,244,'虚像')+dim([95,265],[220,265],distance)+line([95,105],[345,105],true);}
 add('phy-mirror',9,'小孩高1.4米、初距镜1.2米，向镜移动0.4米',()=>mirrorScene('初距1.2 m')+arrow([115,160],[180,160])+text(142,140,'向镜0.4 m',12)+text(61,108,'1.4 m',12));
 add('phy-mirror',10,'蜡烛固定，平面镜远离蜡烛移动5厘米',()=>mirrorScene('')+text(90,75,'蜡烛固定')+line([265,35],[265,245],true)+arrow([226,60],[260,60])+text(300,45,'镜移动5 cm')+note('实线初始镜面；右侧虚线移动后镜面'));
 add('phy-mirror-lab',9,'竖直玻璃板两侧两枚相同棋子，刻度尺测距',()=>mirror()+box(80,125,50,85,'棋子①')+box(310,125,50,85,'棋子②')+dim([105,255],[335,255],'刻度尺')+text(255,25,'竖直玻璃板')+note('从①侧观察，移动②使其与像重合'));
 add('phy-mirror-lab',10,'物距像距对照测量，10.0与10.1、15.0与14.9、20.0与20.0厘米',()=>mirrorScene('物距 / 像距分别测量')+text(220,20,'10.0/10.1；15.0/14.9；20.0/20.0 cm',12));
 function reflection(angle=60,showAngle=true){const o=[220,220],r=angle*Math.PI/180,a=[220-180*Math.sin(r),220-180*Math.cos(r)],b=[220+180*Math.sin(r),220-180*Math.cos(r)];return line([30,220],[410,220])+line([220,30],o,true)+arrow(a,o)+arrow(o,b)+text(245,40,'法线')+text(355,245,'镜面')+(showAngle?text(110,207,'与镜面30°'):'')+label(o,'O',0,24);}
 add('phy-reflection',9,'入射光与镜面夹角30度，入射角和反射角待求',()=>reflection());
 add('phy-reflection',10,'A经镜面反射到B，再从B沿原路径逆向入射',()=>reflection(40,false)+text(80,75,'A')+text(355,75,'B')+note('沿B→O反向入射，检验光路'));
 add('phy-diffuse',9,'平行光在平面和不同倾角的局部表面反射',()=>{
  const ray=(h,slope)=>{const start=[h[0]-35,h[1]-115],n=[-slope,1],d=[35,115],k=2*(d[0]*n[0]+d[1]*n[1])/(n[0]**2+n[1]**2),r=[d[0]-k*n[0],d[1]-k*n[1]];return arrow(start,h)+arrow(h,[h[0]+r[0]*.5,h[1]+r[1]*.5]);};
  return line([25,210],[205,210])+[55,110,165].map(x=>ray([x,210],0)).join('')+poly([[250,215],[285,197.5],[320,215],[355,197.5],[390,215]])+ray([267.5,206.25],-.5)+ray([337.5,206.25],-.5)+ray([372.5,206.25],.5)+text(110,260,'光滑镜面')+text(325,260,'粗糙表面')+note('每一处反射都以该处法线为准');
 });
 add('phy-diffuse',10,'黑板反光进入部分同学眼睛，改变方向或表面粗糙程度',()=>box(45,85,35,140,'黑板')+arrow([260,45],[80,155])+arrow([80,155],[330,235])+text(280,28,'照明光')+text(330,263,'受反光影响的眼睛')+note('讨论光照方向和表面粗糙程度'));
 add('phy-refraction',9,'空气入水，入射角40度、折射角29度，角从法线量起',()=>{const o=[220,150],r=d=>d*Math.PI/180;return line([25,150],[415,150])+line([220,25],[220,280],true)+arrow([220-130*Math.sin(r(40)),150-130*Math.cos(r(40))],o)+arrow(o,[220+135*Math.sin(r(29)),150+135*Math.cos(r(29))])+text(365,75,'空气')+text(365,225,'水')+text(245,35,'法线')+text(191,119,'40°')+text(243,188,'29°');});
 add('phy-refraction',10,'水中筷子发出的光折射进入上方眼睛',()=>line([30,145],[410,145])+poly([[130,45],[175,145],[220,240]])+arrow([220,240],[285,145])+arrow([285,145],[365,60])+line([285,145],[228.5,205],true)+text(370,40,'眼睛')+text(100,80,'筷子')+text(100,205,'水')+text(338,213,'反向延长线',12));
 add('phy-shallow',9,'杯底硬币和眼睛固定，加水后可见硬币的折射光路',()=>poly([[100,70],[100,245],[305,245],[305,70]])+line([100,150],[305,150])+dot([180,235],7)+arrow([180,235],[285,150])+arrow([285,150],[385,50])+text(385,32,'眼睛不动')+text(165,270,'硬币固定')+text(160,128,'加水后的水面',12));
 add('phy-shallow',10,'鱼的虚像深20厘米，真实鱼比像更深',()=>line([30,75],[410,75])+label([170,230],'鱼（实际位置）',0,24)+label([170,137.5],'像（深20 cm）',-8,-10)+arrow([170,230],[270,75])+arrow([270,75],[350,25])+line([170,137.5],[270,75],true)+note('不能只由像深单独确定真实深度'));
 function lens(x=220){return line([x,45],[x,240])+poly([[x-8,55],[x,45],[x+8,55]])+poly([[x-8,230],[x,240],[x+8,230]]);}
 function convex(u,f=65){const x=220,y=150,h=35,v=f*u/(u-f),ix=x+v,iy=y+h*v/u;let s=line([25,y],[415,y],true)+lens(x)+label([x-f,y],'F',0,22)+label([x+f,y],'F′',0,22)+text(x+12,174,'O',12)+object(x-u,y,h,'物')+arrow([x-u,y-h],[x,y-h]);if(u>f)s+=arrow([x,y-h],[ix,iy])+arrow([x-u,y-h],[ix,iy])+arrow([ix,y],[ix,iy])+text(ix,iy+21,'像');else s+=arrow([x,y-h],[385,y-h+(385-x)*h/f])+arrow([x,y],[385,y+165*h/u])+line([ix,iy],[x,y-h],true)+line([ix,iy],[x,y],true)+arrow([ix,y],[ix,iy],true)+text(ix,iy-10,'虚像');return s;}
 add('phy-lens',9,'安全平行光经两类透镜后分别会聚和发散',()=>{
  let s=line([25,145],[420,145],true)+line([130,60],[130,240])+poly([[122,70],[130,60],[138,70]])+poly([[122,230],[130,240],[138,230]])+line([310,60],[310,240])+poly([[302,60],[310,70],[318,60]])+poly([[302,240],[310,230],[318,240]]);
  for(const y of [105,145,185])s+=arrow([30,y],[130,y])+arrow([130,y],[205,145])+arrow([240,y],[310,y])+arrow([310,y],[405,y+(y-145)*95/65])+line([245,145],[310,y],true);
  return s+text(130,35,'凸透镜')+text(310,35,'凹透镜')+note('用安全平行光源，比较出射光束');
 });
 add('phy-lens',10,'凸透镜物体在焦距以内时，出射光可以发散',()=>convex(50,70)+note('反例：物体位于焦距以内，u < f'));
 add('phy-focus',9,'光心40.0厘米，平行光聚在55.0厘米，另侧焦点待求',()=>line([35,150],[410,150],true)+lens()+[80,115,185].map(y=>arrow([40,y],[220,y])+arrow([220,y],[355,150])).join('')+label([220,150],'40.0 cm',0,110)+label([355,150],'55.0 cm',0,110)+text(220,25,'平行主轴光入射'));
 add('phy-focus',10,'用平行主轴光线和过光心光线定位凸透镜实像',()=>convex(140,60)+note('两条特殊光线的出射光交于像点'));
 add('phy-imaging',9,'焦距10厘米，物距依次30、20、15、5厘米',()=>line([30,160],[410,160],true)+lens(315)+[165,215,240,290].map((x,i)=>arrow([x,160],[x,110])+text(x,i%2?230:205,[30,20,15,5][i]+' cm',13)).join('')+label([265,160],'F',0,24)+label([365,160],'F′',0,24)+note('四种物距分别放置；像的性质待判断'));
 add('phy-imaging',10,'焦距12厘米，已观察到倒立放大实像，距离范围待判断',()=>convex(100,65)+note('题设f=12 cm；倒立放大实像，图不按比例'));
 add('phy-lens-lab',9,'蜡烛10厘米刻度，透镜40厘米，焦距10厘米，光屏位置待找',()=>line([30,150],[410,150],true)+line([30,235],[410,235])+object(75,150,70,'10 cm蜡烛')+lens(255)+text(255,265,'40 cm透镜')+label([195,150],'F',0,22)+label([315,150],'F′',0,22)+text(370,75,'光屏位置？')+note('f=10 cm；三者中心大致同高'));
 add('phy-lens-lab',10,'凸透镜上半部遮光，来自同一物点的光仍可通过下半部',()=>line([25,150],[415,150],true)+lens()+object(75,150,35,'物')+[180,200].map(y=>arrow([75,115],[220,y])+arrow([220,y],[337.8125,178.4375])).join('')+arrow([337.8125,150],[337.8125,178.4375])+`<rect x="208" y="48" width="24" height="102" fill="#cad2cd"/>`+text(115,40,'上半部遮光')+line([337.8125,85],[337.8125,250])+text(375,75,'光屏')+note('物、镜、屏位置不变；比较遮光前后'));
 add('phy-applications',9,'焦距8厘米，为照相机投影和放大观察选择物距',()=>line([30,160],[410,160],true)+lens(245)+label([175,160],'F',0,22)+label([105,160],'2F',0,22)+label([315,160],'F′',0,22)+label([385,160],'2F′',0,22)+text(220,30,'f = 8 cm')+note('在主轴上选择物体位置并判断像的性质'));
 add('phy-applications',10,'投影成清晰放大实像，调整物镜屏使像更大',()=>convex(100,65)+line([406,100],[406,255])+text(400,80,'光屏')+note('物、透镜、光屏沿主光轴调整'));
 add('phy-eye',9,'远物经模型眼会聚于固定光屏前',()=>line([25,155],[410,155],true)+lens(180)+line([345,55],[345,255])+[85,225].map(y=>arrow([30,y],[180,y])+arrow([180,y],[285,155])+line([285,155],[345,155+(155-y)*60/105])).join('')+text(345,35,'固定光屏')+note('远物清晰像在屏前；矫正镜片待选择'));
 add('phy-eye',10,'近视会聚在视网膜前，远视会聚在视网膜后',()=>{
  let s='';for(const [y,fx,title] of [[90,270,'近视'],[235,390,'远视']]){
   s+=text(75,y-48,title)+line([190,y-38],[190,y+38])+line([330,y-45],[330,y+45])+text(360,y+48,'视网膜',12);
   for(const h of [-25,25])s+=arrow([40,y+h],[190,y+h])+arrow([190,y+h],[fx,y])+(fx<330?line([fx,y],[330,y-h*(330-fx)/(fx-190)]):'');
  }return s;
 });
 add('phy-instruments',9,'显微镜物镜先成中间像，再由目镜观察',()=>flow(['微小物体','物镜','中间像','目镜'])+note('按光的传播顺序，说明两次成像'));
 add('phy-instruments',10,'开普勒望远镜的物镜与目镜顺序',()=>flow(['远处景物','物镜','中间缩小像','目镜'])+note('目镜用于观察物镜所成的中间像'));
 function prism(){return arrow([25,110],[154,110])+poly([[170,65],[115,220],[245,220]],true)+line([154,110],[218.4,165])+[0,1,2,3,4,5,6].map(i=>`<path d="M218.4,165 L375,${190+i*10}" fill="none" stroke="${['#b94848','#b57336','#a38a23','#488455','#4379a1','#5e65a1','#81519a'][i]}"/>`).join('')+line([375,65],[375,265])+text(70,90,'白光')+text(375,45,'白屏');}
 add('phy-spectrum',9,'窄束白光经过三棱镜，在白屏形成色散光谱',()=>prism());
 add('phy-rgb',9,'红绿蓝三束光照到白屏同一区域',()=>arrow([65,65],[280,160])+arrow([65,150],[280,160])+arrow([65,235],[280,160])+text(50,48,'红光')+text(50,132,'绿光')+text(50,270,'蓝光')+box(275,80,100,160,'白屏重叠区域'));
 add('phy-straight',9,'固定烛焰和小孔，小孔成像光屏向远处移动',()=>{const o=[205,150];return object(65,195,90,'烛焰')+line([205,45],[205,143])+line([205,157],[205,265])+arrow([65,105],o)+arrow(o,[330,190.18])+arrow([65,195],o)+arrow(o,[330,109.82])+line([330,60],[330,250])+line([390,40],[390,270],true)+arrow([335,55],[385,55])+text(365,34,'屏移远')+text(205,288,'小孔');});
 add('phy-straight',10,'三块带小孔纸板与光源、眼睛共线，再移动一块',()=>line([35,150],[400,150],true)+[120,220,320].map(x=>line([x,55],[x,143])+line([x,157],[x,250])+text(x,275,'纸板')).join('')+text(40,125,'光源')+text(395,125,'眼睛')+note('三个孔先对齐，再移动其中一块纸板'));
 add('phy-invisible',9,'光谱红光外侧放温度计并设相同温度计作对照',()=>prism()+box(252,34,105,35,'红光外侧测温')+box(90,255,140,32,'同样温度计对照'));
 add('phy-temperature',9,'玻璃泡充分浸没温水，不接触容器底或壁',()=>poly([[110,65],[110,245],[330,245],[330,65]])+line([110,150],[330,150])+`<rect x="214" y="55" width="12" height="138" fill="#f7eee2"/><circle cx="220" cy="204" r="13" fill="#b9604e"/><path d="M220,110 V204" stroke="#b9604e" stroke-width="5"/>`+arrow([380,110],[230,110])+text(362,89,'读数视线',12)+note('视线对准液柱上表面；玻璃泡不碰底壁'));
 add('phy-cooling',9,'0、2、4、6分钟水温80、68、60、54摄氏度',()=>graph('横轴t / min；纵轴T / ℃',[[[0,80],[2,68],''],[[2,68],[4,60],''],[[4,60],[6,54],'']],[[0,80,'80'],[2,68,'68'],[4,60,'60'],[6,54,'54']],[[-.8,7],[-5,95]]));
 add('phy-cooling',10,'热水降温曲线逐渐变平，室温保持恒定',()=>line([45,240],[405,240])+line([45,240],[45,35])+`<path d="M60,55 C105,150 160,185 390,200" fill="none"/>`+line([45,215],[400,215],true)+text(290,235,'恒定室温',12)+text(405,265,'t')+text(30,30,'T')+note('曲线逐渐变平，是否仍在放热待说明'));
 add('phy-evaporation',9,'控制容器水量液面通风，比较不同温度下蒸发',()=>flow(['同容器同量水：温度低','同容器同量水：温度高'])+note('液面面积、通风、观察时间等保持一致'));
 add('phy-evaporation',10,'展开通风衣服与叠放不通风衣服，同时改变两个变量',()=>flow(['展开 + 通风','叠放 + 不通风'])+note('同时改变了表面积、空气流动'));
 add('phy-boiling',9,'加热水记录96、98、98、98摄氏度，后几次持续翻滚',()=>line([45,240],[405,240])+line([45,240],[45,35])+poly([[65,205],[150,90],[240,90],[360,90]])+text(65,227,'96℃',12)+text(150,75,'98℃',12)+text(240,75,'98℃',12)+text(360,75,'98℃',12)+text(405,265,'t')+note('后几次持续翻滚；记录点连线仅作示意'));
 add('phy-boiling',10,'比较蒸发和沸腾的发生位置',()=>flow(['蒸发：液体表面','沸腾：表面及内部'])+note('再比较温度条件、剧烈程度及能量变化'));
 add('phy-liquid',9,'冷水杯外水珠的对照实验，检验是否由杯内渗出',()=>box(75,65,120,160,'冷水杯')+box(265,65,120,160,'同样杯作对照')+[70,200].map(x=>dot([x,120],4)+dot([x,155],4)+dot([x,190],4)).join('')+note('可在杯内加食用色素，观察外侧水珠颜色'));
 add('phy-liquid',10,'冬天公交车窗内侧出现水珠，区分车内车外',()=>line([220,45],[220,245])+text(110,65,'车内：较暖湿空气')+text(325,65,'车外：较冷')+[95,125,155,185].map(y=>dot([210,y],5)).join('')+text(135,230,'水珠在内侧')+text(255,270,'玻璃'));
 add('phy-melting',9,'晶体从60度升到80度，80度平台后继续升温',()=>line([45,240],[405,240])+line([45,240],[45,35])+poly([[65,215],[150,125],[280,125],[375,55]])+text(65,235,'60℃',12)+text(210,110,'80℃平台')+text(390,265,'t')+text(25,35,'T')+note('分析平台前、中、后的状态和吸热情况'));
 add('phy-melting',10,'冰袋冷冻食品降温，比较冰与同温度水',()=>flow(['冰袋 / 冰','冷冻食品','同温度水对照'])+note('比较熔化过程能够吸收热量的作用'));
 add('phy-sublimation',9,'干冰使周围空气降温形成可见白雾',()=>flow(['干冰','周围空气降温','可见白雾'])+note('分别说明干冰变化与白雾成分'));
 add('phy-sublimation',10,'清晨室外窗面有霜，室内窗面有水珠',()=>line([220,45],[220,245])+text(105,65,'室内窗面')+text(335,65,'室外窗面')+text(135,150,'● 小水珠')+text(315,150,'＊ 霜')+text(220,270,'同一窗玻璃，两侧条件不同'));
 add('phy-water-cycle',9,'湖水到水蒸气、云滴、冰晶、融水的顺序',()=>flow(['湖水','水蒸气','云中水滴','冰晶','融水'])+note('依次写出各箭头的物态变化及吸放热'));
 add('phy-water-cycle',10,'海水蒸发经过云和降水进入淡水利用环节',()=>flow(['海水','水蒸气','云','降水','淡水利用'])+note('水循环不代表可利用淡水无限或无污染'));
 add('phy-length',9,'毫米分度尺上金属片左端2.00厘米，右端7.36厘米',()=>{let s=box(110,85,214.4,55,'金属片');for(let i=0;i<=80;i++){const x=30+i*4;s+=line([x,170],[x,170+(i%10===0?22:i%5===0?15:8)]);if(i%10===0)s+=text(x,215,i/10,12);}return s+line([110,140],[110,170],true)+line([324.4,140],[324.4,170],true)+text(110,65,'2.00 cm')+text(325,65,'7.36 cm')+note('最小分度1 mm；读数以题干数值为准');});
 add('phy-length',10,'用直尺和两个直角辅助物测硬币直径',()=>line([55,230],[395,230])+box(90,65,25,160,'')+box(305,65,25,160,'')+`<circle cx="210" cy="155" r="95" fill="#f7f0dc"/>`+dim([115,250],[305,250],'两内侧刻度之差')+note('辅助物平行，内侧分别紧靠硬币两端'));
 add('phy-time',9,'单摆完整往返，回到起点且方向相同时计一次',()=>line([115,45],[325,45])+line([220,45],[135,205],true)+line([220,45],[305,205],true)+line([220,45],[220,226.18])+dot([220,226.18],13)+dot([135,205],10)+dot([305,205],10)+`<path d="M135,205 Q220,247.36 305,205" fill="none"/>`+note('回到同一点且运动方向相同，计一次往返'));
 add('phy-uniform',9,'匀速直线运动2秒走8米，求5秒路程及s—t图特征',()=>graph('横轴t / s；纵轴s / m',[[[0,0],[5.5,22],'']],[[2,8,'(2 s, 8 m)']],[[-.5,6],[-2,26]]));
 add('phy-uniform',10,'甲2秒走10米，乙3秒走12米，同地同时同向',()=>flow(['共同起点','甲：2 s走10 m','乙：3 s走12 m'])+note('两者同向匀速；10 s后间距待求'));
 add('phy-average',9,'120米20秒，停10秒，180米30秒的分段运动',()=>flow(['120 m / 20 s','停止 / 10 s','180 m / 30 s'])+note('全过程的平均速度包含停车时间'));
 add('phy-average',10,'150米列车完全通过450米大桥，车速15米每秒',()=>box(50,95,100,45,'列车150 m')+box(150,155,250,35,'大桥450 m')+arrow([60,65],[145,65])+text(100,43,'15 m/s')+note('起：车头上桥；止：车尾离桥'));
 add('phy-reference',9,'甲乙两车同向，地面速度分别20与15米每秒',()=>box(60,75,170,45,'甲车20 m/s')+arrow([245,97],[375,97])+box(60,170,170,45,'乙车15 m/s')+arrow([245,192],[340,192])+line([35,250],[405,250])+text(220,278,'地面参照'));
 add('phy-reference',10,'加油机与受油机通过加油管连接，讨论相对运动',()=>flow(['加油机','加油管','受油机'])+arrow([90,65],[350,65])+text(220,45,'两机相对地面同向运动')+note('分别以两机或地面作为参照物'));
 add('radical-add',10,'分三段路线与直达路线比较，长度均为已知根式',()=>poly([[45,205],[140,75],[270,180],[390,90]])+line([45,205],[390,90],true)+text(78,130,'√48 km')+text(205,110,'√75 km')+text(340,160,'√27 km')+text(240,250,'直达10√3 km')+note('两条路线同起终点，速度均6 km/h'));
 function render(q){const e=q?.type==='solution'&&bank[q.id];if(!e)return '';return `<figure class="practice-diagram"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 320" role="img" aria-label="${esc(e.description)}"><title>${esc(e.description)}</title><g fill="none" stroke="#426957" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" font-family="system-ui, Microsoft YaHei, sans-serif">${e.draw()}</g></svg><figcaption>示意图，不按比例；以题干条件和标注为准。</figcaption></figure>`;}
 return {render,ids:Object.freeze(Object.keys(bank))};
});
