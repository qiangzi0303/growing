/* 原资料：math/初中几何模型/初中几何模型汇总.pdf，8页扫描版。
 * 保留原模型编号；原资料没有模型30。证明和例题为本项目重新编写。
 * 坐标只负责展示，证明依据写在步骤中，不以测量代替证明。 */
(() => {
  'use strict';
  const models=[];
  const scene=(points,base,aux='',faces='',extra={})=>({points,base,aux,faces,...extra});
  const add=(id,title,group,pages,nodes,advanced,given,result,steps,diagram,question,answer,variants=[])=>models.push({id,title,group,pages,nodes,advanced,given,result,steps,diagram,question,answer,variants});
  const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  const rot=(p,c,a)=>{const x=p[0]-c[0],y=p[1]-c[1];return[c[0]+x*Math.cos(a)-y*Math.sin(a),c[1]+x*Math.sin(a)+y*Math.cos(a)];};
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const foot=(p,a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],t=((p[0]-a[0])*x+(p[1]-a[1])*y)/(x*x+y*y);return[a[0]+t*x,a[1]+t*y];};
  const bisector=(O,A,B)=>{let u=dist(O,A),v=dist(O,B);return[O[0]+(A[0]-O[0])/u+(B[0]-O[0])/v,O[1]+(A[1]-O[1])/u+(B[1]-O[1])/v];};
  const intersection=(a,b,c,d)=>{let x=b[0]-a[0],y=b[1]-a[1],u=d[0]-c[0],v=d[1]-c[1],t=((c[0]-a[0])*v-(c[1]-a[1])*u)/(x*v-y*u);return[a[0]+t*x,a[1]+t*y];};
  add(1,'线段双中点','中点',[1],['tri-lines'],false,
    'C在线段AB上，M、N分别为AC、BC的中点。','MN = AB / 2。',
    ['按A、M、C、N、B的顺序标点，记AC=a，CB=b。','中点定义给出MC=a/2，CN=b/2。','M、N分居C两侧，MN=MC+CN=(a+b)/2。','由AB=a+b，得到MN=AB/2。C移动时结论仍成立。'],
    scene({A:[0,0],M:[1.5,0],C:[3,0],N:[5.5,0],B:[8,0]},'A B','M N','',{visible:['M','C','N']}),
    'AB=18，AC=8，M、N仍是两段的中点，求MN。','MC=4，CN=5，所以MN=9。不能把MN误写成两段半长的差。');
  add(2,'角的双角平分线','角平分线',[2],['tri-lines','angle-bisector'],false,
    '射线OP在∠AOB内部，ON平分∠AOP，OM平分∠BOP。','∠MON = ∠AOB / 2。',
    ['设∠AOP=α，∠POB=β，则∠AOB=α+β。','角平分线给出∠NOP=α/2，∠POM=β/2。','ON、OM分居OP两侧，因此∠NOM=∠NOP+∠POM。','相加得到∠NOM=(α+β)/2，OP的位置不改变结论。'],
    (()=>{const p=d=>[5*Math.cos(d*Math.PI/180),5*Math.sin(d*Math.PI/180)];return scene({O:[0,0],A:p(70),N:p(50),P:p(30),M:p(15),B:p(0)},'O A;O P;O B','O N;O M','O N M');})(),
    '∠AOB=100°，∠AOP=40°，求∠MON。','∠NOP=20°，∠POM=30°，∠MON=50°。');
  add(3,'猪蹄模型','平行',[1],['tri-angles'],false,
    'AB∥CD，O在两条平行线之间，按图连接BO、DO。','∠BOD = ∠ABO + ∠CDO。',
    ['只讨论图示O在平行线之间的情形。','过O作OE∥AB∥CD，E取在右侧。','内错角相等：∠BOE=∠ABO，∠EOD=∠CDO。','两角相加得∠BOD=∠ABO+∠CDO。'],
    scene({A:[-4,2],B:[2,2],O:[0,0],C:[-4,-2],D:[3,-2],E:[4,0]},'A B O D C','O E','B O E;E O D'),
    'AB∥CD，∠ABO=32°，∠CDO=41°，求∠BOD。','过O作平行线，将两角转移至O，∠BOD=32°+41°=73°。');
  add(4,'铅笔头模型','平行',[1],['tri-angles'],false,
    'AB∥CD，B、O、C构成向右突出的折线，如图。','∠ABO + ∠BOC + ∠OCD = 360°。',
    ['明确三个角均取图示非优角。','过O作OE∥AB，E在O左侧。','∠BOE=180°−∠ABO，∠EOC=180°−∠OCD。','由∠BOC=∠BOE+∠EOC，移项得三个角之和为360°。'],
    scene({A:[-4,2],B:[0,2],O:[3,0],C:[0,-2],D:[-4,-2],E:[-3,0]},'A B O C D','O E','B O E;E O C'),
    '∠ABO=135°，∠OCD=140°，求∠BOC。','∠BOC=360°−135°−140°=85°。');
  add(5,'锯齿模型','平行',[1],['tri-angles'],false,
    'AB∥EF，B、C、D、E构成图示锯齿折线。','∠ABC + ∠CDE = ∠BCD + ∠DEF。',
    ['令BC与向左水平射线的夹角为x，CD与向右水平射线的夹角为y，DE与向左水平射线的夹角为z。','分别过C、D作与AB平行的辅助线。','由平行线角关系，∠B=x，∠C=x+y，∠D=y+z，∠E=z。','因此∠B+∠D=x+y+z=∠C+∠E。'],
    scene({A:[-4,3],B:[3,3],C:[0,1],D:[3,-.4],E:[-1,-2],F:[4,-2],G:[4,1],H:[-2,-.4]},'A B C D E F','C G;D H','B C G;C D H'),
    '∠B=30°，∠C=70°，∠E=25°，求∠D。','由∠B+∠D=∠C+∠E，得∠D=65°。必须先认清每个小角的位置。');
  add(6,'牛角模型','平行',[1],['tri-angles'],false,
    'AB∥CD，E在两平行线外侧，∠ABE>∠CDE，图示B、D在E左下方。','∠BED = ∠ABE − ∠CDE。',
    ['先确认E在平行线外，而不是两线之间。','过E作EF∥AB∥CD，F在E左侧。','同旁内角互补，∠BEF=180°−∠ABE，∠DEF=180°−∠CDE。','两角作差：∠BED=∠DEF−∠BEF=∠ABE−∠CDE。'],
    scene({A:[-4,1],B:[0,1],C:[-4,-2],D:[2,-2],E:[3,4],F:[-2,4]},'A B E D C','E F','B E F;D E F'),
    '∠ABE=150°，∠CDE=110°，求∠BED。','∠BED=150°−110°=40°；内拐点用和，外拐点按位置用差。');
  add(7,'8字角模型','其他',[7],['tri-angles'],false,
    'AC、BD相交于O，连接AB、CD，形成两个对顶三角形。','∠OAB + ∠ABO = ∠OCD + ∠CDO。',
    ['分别观察△AOB与△COD。','交点O处的∠AOB与∠COD是对顶角，相等。','由三角形内角和，∠A+∠B=180°−∠AOB；∠C+∠D=180°−∠COD。','减去相等的角，得到上下两组三角形底角和相等。'],
    scene({A:[-3,2],B:[3,3],O:[0,0],C:[3,-2],D:[-3,-3]},'A B O A;C D O C','','A O B;C O D'),
    '∠A=35°，∠B=65°，∠C=48°，求∠D。','∠D=35°+65°−48°=52°。');
  add(8,'A字外角模型','其他',[8],['tri-angles'],false,
    'B在射线AD上，C在射线AE上，D、E分别在B、C的外侧，连接BC。','∠DBC + ∠ECB = 180° + ∠A。',
    ['在△ABC中，∠ABC+∠ACB=180°−∠A。','BD与BA反向，所以∠DBC=180°−∠ABC。','同理，∠ECB=180°−∠ACB。','相加消元得360°−(180°−∠A)=180°+∠A。'],
    scene({A:[0,4],B:[-1.5,1],C:[1.5,1],D:[-2.5,-1],E:[2.5,-1]},'D A E;B C','','A B C'),
    '∠A=40°，∠DBC=110°，求∠ECB。','∠ECB=180°+40°−110°=110°。');
  add(9,'飞镖模型','其他',[8],['tri-angles'],false,
    '凹四边形ABDC中，D为凹顶点；这里∠BDC取凹口处小角。','∠BDC = ∠A + ∠ABD + ∠ACD。',
    ['连接AD，且AD在凹口小角的外部延长方向上。','在△ABD中，沿AD向下延长产生的D处外角等于∠BAD+∠ABD。','在△ACD中，另一侧外角等于∠CAD+∠ACD。','两个外角相加为∠BDC，而∠BAD+∠CAD=∠A，结论成立。'],
    scene({A:[0,4],B:[-3,0],D:[0,1.5],C:[3,0],E:[0,-1]},'A B D C A','A D E','A B D;A D C'),
    '凹口小角为130°，∠A=50°，∠ABD=35°，求∠ACD。','∠ACD=130°−50°−35°=45°。不要把凹顶点的优角当作此处小角。');
  add(10,'角平分线四种构造','角平分线',[2],['angle-bisector','cong-hl','isosceles'],false,
    'OP平分∠MON，P在平分线上。主图：PA⊥OM，PB⊥ON。','PA=PB；OA=OB；∠APO=∠BPO。',
    ['△OAP、△OBP都是直角三角形，OP为公共斜边，∠AOP=∠BOP。','由一个锐角与斜边对应相等（AAS）得到△OAP≌△OBP。','全等对应边给出PA=PB、OA=OB，对应角给出∠APO=∠BPO。','记住三种变式：截取等长造SAS；过P作平分线的垂线造反射；过P作平行线造等腰。'],
    (()=>{const O=[0,0],M=[5,4],N=[6,0],P=[3,1.052343178];return scene({O,M,N,P,A:foot(P,O,M),B:foot(P,O,N)},'O M;O N;O P','P A;P B','O A P;O B P');})(),
    'P在角平分线上，到边OM的距离为4，OP=5。求P到ON的距离以及OA。','到ON的距离PB=PA=4；在直角△OAP中，OA=√(25−16)=3。',[
      ['截取等长','A在OM上，在ON上取OB=OA，连接PA、PB。OA=OB，OP公共，∠AOP=∠BOP，故SAS全等，PA=PB且∠APO=∠BPO。'],
      ['垂直平分线','A在OM上，AP⊥OP且延长AP交ON于B。两直角三角形由ASA全等，PA=PB且OA=OB。注意此变式PA不一定垂直OM。'],
      ['平行造等腰','过P作PQ∥ON交OM于Q。∠QOP=∠PON，∠QPO=∠PON，所以∠QOP=∠QPO，OQ=PQ。']]);
  add(11,'双角平分线三种交角','角平分线',[3],['tri-angles','angle-bisector'],false,
    '△ABC中，BD、CD分别平分B、C处的内角，交于D。','内内：∠BDC=90°+∠A/2；外外：90°−∠A/2；内外：∠A/2。',
    ['内内情形：在△BDC中，B、C处的角分别为∠B/2、∠C/2。','因此∠BDC=180°−(∠B+∠C)/2=90°+∠A/2。','外外情形：底角为(180°−∠B)/2、(180°−∠C)/2，内角和给出90°−∠A/2。','内外情形：例如C处外角平分线与B处内角平分线相交，则D处角=(∠A+∠B)/2−∠B/2=∠A/2。'],
    (()=>{const A=[0,4],B=[-3,0],C=[3,0],D=[0,1.5];return scene({A,B,C,D},'A B C A','B D;C D','B D C');})(),
    '∠A=60°，分别求内内、外外、内外角平分线交成的图示角。','依次为120°、60°、30°。必须先区分平分的是内角还是外角。',[
      ['两个外角','延长AB过B到E、AC过C到F，分别平分∠EBC、∠FCB，两平分线交于BC下方；图示D处角=90°−∠A/2。'],
      ['一个内角一个外角','B的内角平分线与C的外角平分线交于BC上方外侧，D处小角=∠A/2。']]);
  add(12,'一线三等角全等','全等',[3],['cong-asa','congruence'],false,
    'A、P、B依次共线，C、D在线段AB同侧，∠CAP=∠CPD=∠PBD，AP=BD。','△APC≌△BDP。',
    ['设三个相等角均为θ；令∠APC=x。','由直线平角，∠DPB=180°−θ−x；由△APC内角和，∠ACP=180°−θ−x。','于是∠CAP=∠PBD，∠ACP=∠BPD，加上AP=BD，满足AAS。','△APC≌△BDP，因此AC=BP、CP=PD；若已知另两组中的任一组相等，也可用ASA/AAS。'],
    scene({A:[0,0],P:[3,0],B:[5,0],C:[0,2],D:[5,3]},'A B;A C P D B','','A P C;B D P'),
    '图示三个角均为90°，AP=3，BD=3，AC=2，求BP、PD。','全等得BP=AC=2；PD=CP=√(3²+2²)=√13。');
  add(13,'手拉手全等','全等',[3],['cong-sas','equilateral'],false,
    '△ABC、△ADE共顶点A，AB=AC、AD=AE、∠BAC=∠DAE=θ，方向如图，BD与CE交于F。','△ABD≌△ACE；图示∠BFE=θ。',
    ['让AB旋转θ后对应AC，同时让AD旋转θ后对应AE。','两边间的夹角同增减θ，因此∠BAD=∠CAE。','AB=AC、AD=AE且夹角相等，SAS得△ABD≌△ACE，BD=CE。','绕A的同一次旋转把有向线段BD变为CE，所以两直线夹角为θ或其补角；图示射线FB、FE取θ。'],
    (()=>{let A=[0,4],B=[-3,0],C=rot(B,A,Math.PI/3),D=[-.5,1.2],E=rot(D,A,Math.PI/3);let F=intersection(B,D,C,E);return scene({A,B,C,D,E,F},'A B C A;A D E A','B D;C E','A B D;A C E',{motion:{from:['A','B','D'],to:['A','C','E'],center:'A',angle:Math.PI/3}});})(),
    '两个等边三角形按主图摆放，BD=7，求CE及图示两连线的锐夹角。','SAS全等得CE=7；等边三角形的旋转角为60°，锐夹角为60°。');
  add(14,'倍长中线','中点',[1,3],['tri-lines','cong-sas'],false,
    'AD是△ABC的中线，将AD延长到E，使DE=AD，连接BE。','△ADC≌△EDB，AC∥BE且AC=BE。',
    ['由中线定义，BD=DC；补出DE=DA。','∠ADC与∠EDB是对顶角，相等。','用DA=DE、DC=DB及夹角相等，SAS得△ADC≌△EDB。','对应边AC=EB，对应角∠ACD=∠EBD，故AC∥BE。'],
    scene({A:[1,4],B:[-3,0],C:[3,0],D:[0,0],E:[-1,-4]},'A B C A;A D','D E;E B','A D C;E D B',{motion:{from:['A','D','C'],to:['E','D','B'],center:'D',angle:Math.PI}}),
    'AB=6，AC=8，AD=5，D为BC中点。倍长AD到E后，求BE及△ABE周长。','BE=AC=8，AE=2AD=10，所以△ABE周长=6+8+10=24。');
  window.GrowingGeometryModels={models,scene,add,mid,rot,dist,foot,bisector,intersection};
})();
