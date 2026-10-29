(() => {
  'use strict';
  const {add,scene,rot,mid,dist,foot,intersection}=window.GrowingGeometryModels;
  add(31,'最大张角','最值',[6],['tri-angles','perp-bisector'],true,
    'A、B是射线DN上的两个定点，顺序D、A、B；P在另一条射线DM上运动，0°<∠MDN<180°。','当△APB的外接圆与DM相切于P时，∠APB最大；DP²=DA·DB。',
    ['过A、B作一族圆，每个圆与射线DM的交点都对应一个观察角。','设DA=a、DB=b，DP=t，∠MDN=θ。由平面向量或三角恒等式可得cot∠APB=[t+(ab/t)−(a+b)cosθ]/[(b−a)sinθ]。','t+ab/t≥2√(ab)，等号当t=√(ab)。因cot在(0°,180°)上递减，所以此时张角最大。','此时DP²=DA·DB，按切割线定理的逆命题，DM为该圆的切线。切点在允许射线上时可取到最大值。'],
    (()=>{let D=[0,0],A=[2,0],B=[6,0],t=Math.sqrt(12),P=[t/2,t*Math.sqrt(3)/2],O=[4,(24-8*P[0])/(2*P[1])];return scene({D,A,B,P,M:[3,3*Math.sqrt(3)],N:[7,0],O},'D N;D M;A P B','O P;O A;O B','A P B',{circles:[{center:'O',radius:dist(O,A)}]});})(),
    'DA=2、DB=8，P在射线DM上，张角最大时DP是多少？','DP=√(DA·DB)=√16=4。张角大小还依赖两射线夹角，不能只靠这两个长度确定。');
  add(32,'A字相似','平行与相似',[1,5],['tri-angles','midline'],true,
    'D∈AB、E∈AC，DE∥BC，顶点顺序与主图一致。','△ADE∽△ABC，AD/AB=AE/AC=DE/BC。',
    ['∠DAE=∠BAC，是公共顶角。','由DE∥BC，同位角给出∠ADE=∠ABC、∠AED=∠ACB。','两个角对应相等，AA判定△ADE∽△ABC。','按A↔A、D↔B、E↔C书写对应边，得到三个比相等。若改给交叉角相等，则对应顺序必须更换。'],
    scene({A:[0,5],B:[-3,0],C:[4,0],D:[-1.2,3],E:[1.6,3]},'A B C A','D E','A D E;A B C'),
    'AD=3、AB=9、BC=12且DE∥BC，求DE。','相似比AD/AB=1/3，DE=BC/3=4。',[
      ['交叉对应变式','仍有D∈AB、E∈AC，但给∠AED=∠ABC（或∠ADE=∠ACB），则△ADE∽△ACB，AD/AC=AE/AB=DE/CB。原表第5页采用这种交叉对应，不可照搬平行型的边比。']]);
  add(33,'8字相似','平行与相似',[1,5],['tri-angles'],true,
    'D在CA过A的延长线上，E在BA过A的延长线上，DE∥BC。','△AED∽△ABC，AE/AB=AD/AC=DE/BC。',
    ['∠EAD与∠BAC是对顶角，相等。','DE∥BC，内错角相等，∠AED=∠ABC，∠ADE=∠ACB。','由AA得△AED∽△ABC。','按A↔A、E↔B、D↔C写出三个对应边比。若题目给另一组交叉角，则更换对应关系。'],
    scene({A:[0,0],B:[-3,-3],C:[4,-3],D:[-2,1.5],E:[1.5,1.5]},'B E D C B','B C','A E D;A B C',{visible:['A']}),
    'AE=2、AB=6、AC=9、BC=12，DE∥BC，求AD、DE。','相似比1/3，所以AD=3，DE=4。',[
      ['交叉对应变式','若给∠B=∠D（或∠E=∠C），不再要求DE∥BC，则由对顶角与已知角得到△AED∽△ACB；AD/AB=AE/AC=DE/BC。']]);
  add(34,'一线三等角相似','平行与相似',[5],['tri-angles','congruence'],true,
    'A、P、B依次共线，C、D在直线AB同侧，∠CAP=∠CPD=∠PBD。','△CAP∽△PBD。',
    ['设三个角均为θ，∠APC=x。','△CAP内角和给出∠ACP=180°−θ−x。','直线平角给出∠DPB=180°−θ−x，故∠ACP=∠DPB。','加上∠CAP=∠PBD，AA得△CAP∽△PBD；CA/PB=AP/BD=CP/PD。再有一个对应边相等才升级为全等。'],
    scene({A:[0,0],P:[3,0],B:[5,0],C:[0,1.5],D:[5,4]},'A B;A C P D B','','C A P;P B D'),
    'AP=3、BD=6、AC=2，满足三等角条件，求PB。','由AC/PB=AP/BD=1/2，PB=4。图形为条件示意，例题尺寸另给。');
  add(35,'射影定理','平行与相似',[5],['pythagoras','tri-lines'],true,
    'Rt△ABC中，∠ABC=90°，BD⊥AC，D为垂足。','BD²=AD·DC，AB²=AD·AC，BC²=DC·AC。',
    ['由BD⊥AC，两小三角形在D处直角，且锐角互余。','△ADB∽△BDC，得到AD/BD=BD/DC，故BD²=AD·DC。','△ADB∽△ABC，得到AD/AB=AB/AC，故AB²=AD·AC。','△BDC∽△ABC，得到DC/BC=BC/AC，故BC²=DC·AC。斜边是AC，切勿把BD误当斜边。'],
    scene({A:[-3,0],B:[0,4],C:[16/3,0],D:[0,0]},'A B C A','B D','A D B;B D C;A B C'),
    'AD=4、DC=9，求BD、AB、BC。','AC=13，BD=√36=6，AB=√52=2√13，BC=√117=3√13。');
  add(36,'手拉手相似','平行与相似',[5],['cong-sas','tri-angles'],true,
    '△ABC∽△ADE，A↔A、B↔D、C↔E，两个三角形方向一致，连BD、CE交于F。','△ABD∽△ACE；图示∠BFC=∠BAC（另一夹角为其补角）。',
    ['由原相似，AB/AD=AC/AE，移项得AB/AC=AD/AE。','两三角形方向一致，∠BAC=∠DAE，因而∠BAD=∠CAE。','两边成比例且夹角相等，SAS相似判定得△ABD∽△ACE。','以A为中心的同一次旋转伸缩把B映到C、D映到E，所以BD映到CE，图示夹角为∠BAC或其补角，应依射线方向辨别。'],
    (()=>{let A=[0,5],B=[-3,0],C=rot(B,A,Math.PI/3).map((x,i)=>A[i]+.8*(x-A[i])),D=[-.5,2],E=rot(D,A,Math.PI/3).map((x,i)=>A[i]+.8*(x-A[i])),F=intersection(B,D,C,E);return scene({A,B,C,D,E,F},'A B C A;A D E A','B D;C E','A B D;A C E');})(),
    'AB=6、AC=9、AD=4、AE=6，满足同向手拉手条件，BD=5，求CE。','AB/AC=AD/AE=2/3，所以BD/CE=2/3，CE=15/2。');
  add(37,'两圆一中垂','其他',[8],['isosceles','perp-bisector'],false,
    'A、B为两个不同定点，寻找C使△ABC为等腰三角形。','三类候选轨迹：圆(A,AB)、圆(B,AB)、AB的垂直平分线；排除三点共线的退化点。',
    ['若AB=AC，则C到A的距离固定为AB，在以A为圆心、AB为半径的圆上。','若AB=BC，同理C在以B为圆心、AB为半径的圆上。','若CA=CB，则C在AB的垂直平分线上。','三种等边关系的并集覆盖所有等腰情形；再剔除C=A、C=B及所有使三点共线的点。等边三角形同时属于三类。'],
    scene({A:[-2,0],B:[2,0],E:[0,0],P:[0,Math.sqrt(12)],Q:[0,-Math.sqrt(12)],U:[0,-5],V:[0,5]},'A B','U V;A P B','A P B',{circles:[{center:'A',radius:4},{center:'B',radius:4}]}),
    'A=(0,0)、B=(4,0)，C=(2,y)。哪些y使三角形为等腰？何时等边？','垂直平分线上CA=CB，任何y≠0均为等腰；等边要求4+y²=16，故y=±2√3。');
  add(38,'两垂一圆','其他',[8],['pythagoras','tri-lines'],true,
    'A、B为两个不同定点，寻找C使△ABC为直角三角形。','A处直角：过A作AB的垂线；B处直角：过B作垂线；C处直角：以AB为直径的圆。',
    ['若∠A=90°，则AC⊥AB，C在过A的垂线上且C≠A。','若∠B=90°，则BC⊥AB，C在过B的垂线上且C≠B。','若∠C=90°，由直径所对圆周角为直角的逆命题，C在以AB为直径的圆上。','三类轨迹取并集，并排除A、B等退化点。圆的情形用到后续课程；也可先用斜边中点等距理解。'],
    scene({A:[-3,0],B:[3,0],O:[0,0],C:[0,3],U:[-3,-4],V:[-3,4],W:[3,-4],X:[3,4]},'A B','U V;W X;A C B','A C B',{circles:[{center:'O',radius:3}]}),
    'AB=10，C为直径圆上异于端点的一点，AC=6，求BC。','∠ACB=90°，BC=√(10²−6²)=8。不要把圆心角或A处角当作直角。');
  add(39,'阿不归（加权最短路）','最值',[7],['pythagoras','tri-inequality'],true,
    'A在直线l上，B不在l上，P∈l，0<k<1，求k·AP+BP最小值。','最优点满足沿A到B垂足方向移动，k·AP转化为垂直距离；须同时检查P=A的边界情形。',
    ['设H为B到l的垂足，AH=d≥0、BH=h>0。最优P必在线段AH内（否则向该线段移动会缩短路程）。','令AP=x，0≤x≤d，目标f(x)=kx+√((d−x)²+h²)。由勾股定理，BP是直角边d−x、h对应的斜边。','在以H为原点的局部图中，作方向单位向量(k,√(1−k²))。由投影长度不超过线段长，BP≥k(d−x)+h√(1−k²)。','故f≥kd+h√(1−k²)，等号要求d−x=kh/√(1−k²)。若d≥该值，最小值如上；否则等号点越界，最小值在P=A，为AB。'],
    scene({A:[0,0],H:[6,0],B:[6,4],P:[3,0],L:[-1,0],R:[8,0],Q:[3,2]},'L R;A B;P B','B H;P Q','P H B'),
    'AH=6、BH=4、k=3/5，求最小值及AP。','√(1−k²)=4/5，kh/√(1−k²)=3≤6，所以AP=6−3=3；最小值=(3/5)×6+(4/5)×4=34/5。本例P到B的距离为5。');
  add(40,'阿氏圆（母子型转化）','最值',[7],['pythagoras','tri-inequality'],true,
    'P在圆(O,r)上，A在圆外，0<k<1，r=k·OA；B也在圆外。','取OA上的A′使OA′=r²/OA，则k·AP=A′P；目标转为PA′+PB的最小值。',
    ['取坐标O=(0,0)、A=(a,0)、P=(r cosθ,r sinθ)，a>r且k=r/a。','令A′=(r²/a,0)，用距离平方展开：A′P²=(r²/a²)(a²+r²−2ar cosθ)=k²AP²。','距离非负，所以A′P=k·AP；故k·AP+BP=A′P+PB≥A′B。','A′在圆内、B在圆外，线段A′B恰交圆一次；取该交点P即可等号成立，最小值为A′B。若B不在圆外，要重新判断等号可达性。'],
    (()=>{let t=(4.5+Math.sqrt(4.5*4.5+4*38.25*6.75))/(2*38.25);return scene({O:[0,0],A:[-6,0],'A′':[-1.5,0],B:[0,6],P:[-1.5+1.5*t,6*t]},'O A;A P B','A′ B;O P','O A P',{circles:[{center:'O',radius:3}]});})(),
    'OA=8、r=4、k=1/2，OB=6且OA⊥OB，求kAP+BP最小值。','OA′=r²/OA=2，A′B=√(2²+6²)=2√10；A′在圆内而B在圆外，所以该下界能取到。');
  add(41,'瓜豆原理（旋转伸缩轨迹）','最值',[7],['translation','coordinates'],true,
    'C为定点，∠MCN=α且CM/CN=k为常数；必须固定旋转方向。','N是M绕C旋转固定角后再按1/k伸缩的像：直线映为直线，圆映为圆。',
    ['把C作为原点，固定从CM到CN的有向角α。向量满足CN=(1/k)·Rα(CM)。','若M沿直线移动，任意位移向量都被同一旋转伸缩处理，故像轨迹仍是直线；两轨迹直线的夹角为α模180°。','若M在圆(O,R)上，则O映为O′，N在圆(O′,R/k)上。CO/CO′=OM/O′N=k，中心向量旋转角也是α。','C、M、N共线是α=0°或180°的特殊情形；有限线段、圆弧只映为对应线段、圆弧。若只固定无向角而不指定方向，应包含两支轨迹。'],
    (()=>{let C=[0,0],M=[3,2],N=rot(M,C,Math.PI/3).map(x=>x/2),L=[1,2],R=[5,2],U=rot(L,C,Math.PI/3).map(x=>x/2),V=rot(R,C,Math.PI/3).map(x=>x/2);return scene({C,M,N,L,R,U,V},'L R;C M','U V;C N','C M N');})(),
    'M在半径6的圆上运动，CM/CN=3，固定旋转角40°，N轨迹圆半径是多少？','旋转不改变长度，伸缩比为1/3，所以像圆半径2。其圆心为原圆心绕C旋转40°后再缩为1/3的位置。',[
      ['共线直线轨迹','α=0°时为同向位似，α=180°时为反向位似；像直线与原直线平行，过C的原直线则与像直线重合。'],
      ['不共线直线轨迹','旋转伸缩把一条直线映到另一条直线；这里夹角应按有向角或模180°理解，不能总把α当作两直线的锐夹角。'],
      ['共线圆轨迹','位似把圆心O映为O′，半径同步缩放；C、O、O′共线。若O=C，圆心不动，CO/CO′是0/0而不能写为有效比值。'],
      ['不共线圆轨迹','中心和半径均按同一次旋转伸缩变化。先确定像圆心，再确定半径，最后限制允许的圆弧。']]);
  add(42,'婆罗摩笈多变式','其他',[8],['isosceles','cong-sas','tri-lines'],false,
    '△ABC、△DBE都是以B为直角顶点的等腰直角三角形，位置如图。M为CE中点，直线BM交AD于N。','BM⊥AD；BM=AD/2；S△ABD=S△CBE。反过来，若直线BM⊥AD且M∈CE，则M为CE中点。',
    ['延长BM到F，使MF=BM。因为M同时是BF、CE的中点，四边形BCFE是平行四边形，所以CF∥BE且CF=BE。','AB=BC，BD=BE=CF；结合AB⊥BC、BD⊥BE以及图示位置，∠ABD=∠BCF，所以SAS得△ABD≌△BCF。','全等得AD=BF=2BM；又由对应角∠BAD=∠CBF及AB⊥BC，得到AD⊥BF，即BM⊥AD。全等给出S△ABD=S△BCF；F、E在平行于BC的同一直线上，同底等高给出S△BCF=S△BCE。','反向：已经证明CE中点在过B且垂直AD的直线上。垂线唯一，若该直线与CE交于M，则M必是中点（图示非退化情形）。必须核对两三角形的旋转朝向。'],
    (()=>{let B=[0,0],A=[-2,3],C=rot(A,B,Math.PI/2),D=[3,2],E=rot(D,B,-Math.PI/2),M=mid(C,E),N=intersection(B,M,A,D),F=M.map(x=>2*x);return scene({A,B,C,D,E,M,N,F},'A B C A;D B E D;A D;C E','B F;C F E','A B D;B C F;C B E');})(),
    '两个等腰直角三角形按图示反向旋转摆放，AD=10，M为CE中点，求BM；若△ABD面积12，△BCE面积多少？','BM=AD/2=5，△BCE面积12。必须核对两个等腰直角三角形的朝向；同向摆放不具有此中点垂直结论。');
  window.GrowingGeometryModels.models.sort((a,b)=>a.id-b.id);
})();
