(() => {
  'use strict';
  const {add,scene,rot,mid,dist,foot,intersection}=window.GrowingGeometryModels;
  add(15,'半角模型','全等',[4],['square','cong-sas','angle-bisector'],false,
    '正方形ABCD中，M在BC上、N在CD上，∠MAN=45°。','MN=BM+DN；△MCN周长为正方形周长的一半；MA、NA分别平分∠BMN、∠DNM。',
    ['将△ABM绕A逆时针旋转90°到△ADK，K在CD过D的延长线上，DK=BM，AK=AM。','∠KAN=90°−45°=45°=∠MAN，AN公共，由SAS得△AKN≌△AMN。','于是MN=KN=KD+DN=BM+DN；MC+CN+MN=BC+CD。','全等再结合旋转给出∠BMA=∠AMN、∠DNA=∠ANM，两条线确为相应角平分线。'],
    (()=>{const A=[0,4],B=[0,0],C=[4,0],D=[4,4],M=[1.5,0],N=[4,24/11],K=rot(M,A,Math.PI/2);return scene({A,B,C,D,M,N,K},'A B C D A;A M N A','A K;D K;K N','A B M;A D K;A M N',{motion:{from:['A','B','M'],to:['A','D','K'],center:'A',angle:Math.PI/2}});})(),
    '正方形边长8，BM=3，DN=40/11，求MN及△MCN周长。','MN=BM+DN=73/11；周长=2×8=16。长度3和40/11确可使∠MAN=45°。',[
      ['120°半角变式（补全条件）','原表此行只写∠BDC=120°、BD=CD、∠EDF=60°，不足以推出EF=BE+FC。补充∠BAC=60°，E∈AB、F∈AC，D在BC异于A的一侧且构型如原图。将△DBE绕D旋转120°到△DCG，G在FC过C的延长线上；由∠DBE+∠DCF=180°可知F、C、G共线。DE=DG、∠EDG=120°、∠EDF=60°，SAS得△DEF≌△DGF，EF=GF=FC+CG=FC+BE。'],
      ['等腰顶角半角变式（补全构造）','AB=AC，∠BAC=2α，D、E在BC上，∠DAE=α。原表未说明F的构造；补充把D绕A沿B到C方向旋转2α得到F。因AB旋到AC，BD旋到CF，∠ECF=180°−2α；AE平分∠DAF，AD=AF且AE公共，SAS得△ADE≌△AFE。']]);
  add(16,'雨伞模型','角平分线',[3,4],['angle-bisector','cong-asa','isosceles'],false,
    'AP平分∠BAC，过B作BD⊥AP于O，D在AC上。','△ABO≌△ADO，AB=AD，OB=OD。',
    ['两个三角形在O处都是直角，且AO公共。','AP平分顶角，所以∠BAO=∠OAD。','由ASA得△ABO≌△ADO。','对应边给出AB=AD、OB=OD，即AO是等腰△ABD的对称轴。'],
    scene({A:[0,4],B:[-2,0],O:[0,0],D:[2,0],P:[0,-2],C:[3,-2]},'A B;A C;A P','B D','A B O;A D O'),
    'AB=10，AO=8，求AD、BD。','AD=10；BO=√(100−64)=6，OD=BO=6，BD=12。');
  add(17,'将军饮马：两定一动','最值',[5],['reflection','tri-inequality'],false,
    'A、B在直线l同侧，P在线l上。','PA+PB的最小值为AB′；B′是B关于l的对称点。',
    ['把B关于l反射到B′，P位于对称轴上，所以PB=PB′。','连接AB′，与l相交于P₀。','对任意P，PA+PB=PA+PB′≥AB′。','当且仅当A、P、B′依次共线时取等号，最优点为P₀。若A、B分居l两侧，直接取AB与l交点。'],
    scene({A:[-3,3],B:[3,2],"B′":[3,-2],P:[.6,0],L:[-5,0],R:[5,0]},'L R;A P B','B B′;A B′','A P B′',{motion:{from:['B'],to:['B′'],axis:['L','R']}}),
    'l为x轴，A=(0,3)，B=(4,2)，求PA+PB最小值。','反射B得B′=(4,−2)，最小值AB′=√(4²+5²)=√41。最优点为(12/5,0)。',[
      ['异侧两点','A、B分居直线两侧时，三角不等式直接给出PA+PB≥AB，且线段AB与l的交点可以取到等号，不需要反射。']]);
  add(18,'将军饮马：两动一定与两定两动','最值',[6],['reflection','tri-inequality'],false,
    'P为角内定点，M、N分别在角的两边；求PM+MN+NP。','把P关于两边反射为P₁、P₂，周长下界为P₁P₂；展开直线依次穿过两边时可取到。',
    ['将P关于OM反射到P₁，关于ON反射到P₂。','由于M、N各在反射轴上，PM=P₁M，PN=P₂N。','折线P₁—M—N—P₂长度≥P₁P₂。','若直线段P₁P₂依次交正向射线于M、N，等号成立；否则只能讨论边界最小值或退化下确界，不能硬套。'],
    (()=>{let O=[0,0],A=[3,5],B=[6,0],P=[2,1.5],H=foot(P,O,A),P1=[2*H[0]-P[0],2*H[1]-P[1]],P2=[2,-1.5],M=intersection(P1,P2,O,A),N=intersection(P1,P2,O,B);return scene({O,A,B,P,'P₁':P1,'P₂':P2,M,N},'O A;O B;P M N P','P P₁;P P₂;P₁ P₂','P M N');})(),
    '一个60°角的平分线上有P，OP=4，M、N在两边上，求三角形PMN最小周长。','P₁、P₂都距O为4，∠P₁OP₂=120°，P₁P₂=4√3。展开线确实穿过两边，故最小周长4√3。',[
      ['两定两动','给定P、Q，求四边形PQMN周长。将Q关于第一边反射到Q′，P关于第二边反射到P′，得到PQ+Q′M+MN+NP′≥PQ+Q′P′。展开线依次穿过两条允许边且四边形次序成立时取等号。原资料将P′Q′排印为P′Q′的长度，不能忽略取等号条件。']]);
  add(19,'将军饮马：两定点一定长','最值',[6],['translation','tri-inequality'],false,
    'm∥n，MN⊥n且M∈m、N∈n，A在m上方，B在n下方。','AM+MN+NB的最小值为A′B+MN，其中AA′与MN同向等长。',
    ['把A沿M到N方向平移到A′，MN为定长h。','平移把AM对应到A′N，因此AM=A′N。','AM+MN+NB=A′N+NB+h≥A′B+h。','若A′B与n交于允许的N，令M在其正上方即可取等号。若交点不在允许范围，须另外检查端点。'],
    scene({A:[-3,4],'A′':[-3,2],B:[3,-2],M:[0,2],N:[0,0],L:[-5,2],R:[5,2],U:[-5,0],V:[5,0]},'L R;U V;A M N B','A A′;A′ B','A M N'),
    'm:y=2，n:y=0，A=(0,5)，B=(4,−1)，MN=2。求最短路径。','A′=(0,3)，A′B=4√2；最小值2+4√2。N=(3,0)，M=(3,2)，均满足条件。');
  add(20,'矩形的翻折','全等',[4],['rectangle','reflection','isosceles'],false,
    '矩形ABCD沿AC翻折△ABC，B对应B′；AB′与DC交于E，图示E在线段DC内。','△ABC≌△AB′C；AC垂直平分BB′；AE=CE。',
    ['折叠是轴对称，所以AB=AB′，CB=CB′，AC固定。','A、C都到B、B′等距，所以AC是BB′的垂直平分线。','由折叠，∠B′AC=∠BAC；由AB∥DC，∠ACE=∠BAC。','E在AB′上，所以∠EAC=∠ACE，从而AE=CE。若E落在延长线上，必须重新辨认角和线段方向。'],
    (()=>{let A=[0,4],B=[6,4],C=[6,0],D=[0,0],H=foot(B,A,C),Q=[2*H[0]-B[0],2*H[1]-B[1]],E=intersection(A,Q,D,C);return scene({A,B,C,D,'B′':Q,E},'A B C D A;A C','A B′ C;B B′;A E','A B C;A B′ C;A E C',{motion:{from:['A','B','C'],to:['A','B′','C'],axis:['A','C']}});})(),
    '矩形AB=6，BC=4，按主图翻折，求AE。','设AE=CE=x，则DE=6−x。在直角△ADE中，x²=4²+(6−x)²，解得x=13/3。');
  add(21,'垂美四边形','其他',[8],['pythagoras','tri-lines'],false,
    '凸四边形ABCD的对角线AC⊥BD，交于O。','AB²+CD²=AD²+BC²；面积S=AC·BD/2。',
    ['四个小三角形AOB、BOC、COD、DOA都是直角三角形。','分别用勾股定理展开四条边的平方。','AB²+CD²=AO²+BO²+CO²+DO²=AD²+BC²。','面积相加为(AO+CO)(BO+DO)/2=AC·BD/2。只给垂直但非凸时需用有向面积或重新分区。'],
    scene({A:[-3,0],B:[0,-2],C:[5,0],D:[0,3],O:[0,0]},'A B C D A','A C;B D','A O B;B O C;C O D;D O A'),
    'AC=10，BD=8，AB=5，BC=√41，求面积与AD²−CD²。','面积=10×8/2=40；由平方和等式，AD²−CD²=AB²−BC²=25−41=−16。');
  add(22,'中点四边形','中点',[2],['midline','parallelogram'],false,
    'E、F、G、H依次为凸四边形ABCD各边的中点。','EFGH为平行四边形；周长=AC+BD；面积是ABCD面积的一半。',
    ['连接AC、BD，把中点关系放入三角形。','中位线定理给出EF∥HG∥AC，EF=HG=AC/2；同理EH∥FG∥BD，EH=FG=BD/2。','两组对边分别平行，EFGH是平行四边形，周长=AC+BD。','四个角上的小三角形面积之和为原面积一半（各取相邻大三角形的1/4）；剩下中点四边形面积也是一半。'],
    (()=>{let A=[0,4],B=[-3,0],C=[2,-2],D=[5,2];return scene({A,B,C,D,E:mid(A,B),F:mid(B,C),G:mid(C,D),H:mid(D,A)},'A B C D A','A C;B D;E F G H E','A E H;B E F;C F G;D G H');})(),
    '原凸四边形面积48，对角线长8与10，求中点四边形面积及周长。','面积24，周长18。若两对角线垂直，中点四边形还是矩形；若对角线等长，它还是菱形。');
  add(23,'十字架模型','全等',[4],['square','cong-asa','rectangle'],false,
    '正方形ABCD，E∈CD、F∈AD，AE⊥BF。','△ABF≌△DAE，所以BF=AE。矩形变式中△DCE∽△ADB。',
    ['由正方形，AB=DA，∠BAF=∠ADE=90°。','AB⊥AD、BF⊥AE，两组对应垂直线的夹角相等，所以∠ABF=∠DAE。','ASA得△ABF≌△DAE，BF=AE，AF=DE。','矩形变式须换用相似而非全等：E∈AD、CE⊥BD时，∠CDE=∠DAB=90°且∠DCE=∠ADB，故△DCE∽△ADB，CE/DB=CD/DA。'],
    scene({A:[0,4],B:[0,0],C:[4,0],D:[4,4],F:[2,4],E:[4,2],O:[1.6,3.2]},'A B C D A;A E;B F','','A B F;D A E'),
    '正方形边长6，AF=2，AE⊥BF，求DE、AE。','全等得DE=AF=2，AE=BF=√(6²+2²)=2√10。',[
      ['矩形相似变式','矩形ABCD中，E∈AD、CE⊥BD。两个直角三角形DCE、ADB由AA相似；CE/DB=CD/DA。此处没有AB=AD，不能用正方形版本的全等结论。']]);
  add(24,'对角互补模型','全等',[4,5],['cong-asa','pythagoras'],false,
    '凸四边形ABCD，∠ABC=∠ADC=90°，BD平分∠ABC。','AD=CD；AB+BC=√2·BD；面积=BD²/2。',
    ['作DE⊥AB于E，DF⊥BC于F，E、F允许在边的延长线上。BD平分直角，所以DE=DF。','△AED、△CFD在E、F处为直角。由AB⊥BC和AD⊥CD得另一组锐角相等；结合DE=DF，AAS全等，AD=CD且AE=CF。','B、E、D、F组成正方形，记BE=BF=DE=DF=t，则BD=√2t。依照图示位置，AB+BC=2t=√2BD。','由面积分解或坐标A=(0,a)、C=(c,0)、D=(t,t)，直角条件给出2t=a+c，面积=t(a+c)/2=t²=BD²/2。'],
    scene({A:[0,4],B:[0,0],C:[6,0],D:[5,5],E:[0,5],F:[5,0]},'A B C D A;B D','D E;D F;A E','A E D;C F D'),
    'AB=4，BC=6，满足主图条件，求BD和面积。','BD=(4+6)/√2=5√2，面积=BD²/2=25。',[
      ['一般互补角的相似变式','若只知∠ABC+∠ADC=180°，过D作DE⊥AB、DF⊥BC（必要时交延长线），依图示角位置可得△DAE∽△DCF。原页写△DAE∽△DCF，与同一对应顺序一致；不能再推出AD=CD或上述面积公式。']]);
  add(25,'梯子模型','最值',[6],['rectangle','pythagoras','tri-inequality'],true,
    'A、B分别在两条互相垂直的正半轴上，AB、BC均为定长，∠ABC=90°，Q为AB中点；C取图示一侧。','OC≤OQ+QC，允许构型出现O、Q、C依次共线时取最大值。',
    ['△AOB在O处直角，斜边中点Q到三顶点等距，所以OQ=AB/2，为定长。','△QBC在B处直角，QB=AB/2、BC均固定，QC=√((AB/2)²+BC²)，也是定长。','在△OQC中，OC≤OQ+QC。','检验O、Q、C共线且Q在O、C之间能否在允许轨迹上出现；可出现时OC最大为AB/2+√((AB/2)²+BC²)。若BC未定长则无此固定最大值。'],
    scene({O:[0,0],A:[0,4],B:[3,0],C:[5.4,1.8],Q:[1.5,2],X:[6.5,0],Y:[0,5]},'O X;O Y;A B C','O Q;Q C;O C','O Q C'),
    'AB=6、BC=4，允许转到O、Q、C依次共线，求OC最大值。','OQ=3，QC=√(3²+4²)=5，最大值8。本模型需要AB、BC都是定长。');
  add(26,'奔驰模型','其他',[8],['equilateral','cong-sas','pyth-converse'],false,
    '等边△ABC内有D，AD=3、BD=4、CD=5。','∠ADB=150°。',
    ['绕B沿BA到BC的方向旋转60°，使A到C、D到E；连接DE。','旋转给出CE=AD=3，BE=BD=4，∠DBE=60°，所以△BDE是等边三角形，DE=4。','△CDE三边CE=3、DE=4、CD=5，勾股逆定理得∠CED=90°。','图示∠CEB=∠CED+∠DEB=90°+60°=150°；旋转保持角，∠ADB=∠CEB=150°。'],
    (()=>{let B=[0,0],C=[Math.sqrt(25+12*Math.sqrt(3)),0],s=C[0],A=[s/2,s*Math.sqrt(3)/2];let x=(s*s-9)/(2*s),y=Math.sqrt(16-x*x),D=[x,y],E=rot(D,B,-Math.PI/3);return scene({A,B,C,D,E},'A B C A;A D;B D;C D','B E C;D E','B D E;C D E',{motion:{from:['B','A','D'],to:['B','C','E'],center:'B',angle:-Math.PI/3}});})(),
    '把三条距离同时放大为6、8、10，∠ADB会改变吗？','不改变，仍为150°。旋转后得到6、8、10直角三角形，再加等边三角形的60°。');
  add(27,'费马点模型','最值',[6],['equilateral','cong-sas','tri-inequality'],true,
    '△ABC三个内角都小于120°，求平面内PA+PB+PC的最小值。','最优点P在三角形内部，∠APB=∠BPC=∠CPA=120°。',
    ['在AB外侧作等边△ABT。把A、P绕B沿BA到BT旋转60°，P到P′。','旋转给出TP′=AP，BP′=BP，△BPP′等边，PP′=BP。','故AP+BP+CP=TP′+P′P+PC≥TC，等号要求T、P′、P、C依次共线。','展开的等号条件给出P处三个夹角均为120°；三内角都小于120°时该点在内部且可取到。若某内角≥120°，最优点改为该顶点。'],
    (()=>{let A=[0,4],B=[-3,0],C=[3,0],P=[0,Math.sqrt(3)],T=rot(A,B,Math.PI/3),Q=rot(P,B,Math.PI/3);return scene({A,B,C,P,T,'P′':Q},'A B C A;P A;P B;P C','A T B;T P′ P;T C','B P P′',{motion:{from:['B','A','P'],to:['B','T','P′'],center:'B',angle:Math.PI/3}});})(),
    '边长6的等边三角形内，PA+PB+PC最小值是多少？','P取中心，三个距离均为2√3，总和6√3。三个夹角均为120°；展开所得TC也为6√3。');
  add(28,'定点定长轨迹','最值',[6],['reflection','perp-bisector'],false,
    'E为定点，BE为定长，把△BEF沿过E的直线EF翻折，B到B′。','B′始终在以E为圆心、BE为半径的圆上；允许折痕只给出其中一段轨迹。',
    ['折叠是轴对称，折痕上的点E保持不动。','因此EB′=EB，为不变量。','到E距离固定的点构成圆，所以B′在该圆上。','若F限制在某条边上，折痕角度受限，只能得到相应圆弧；应再检查端点及是否包含端点。'],
    (()=>{let B=[0,0],E=[0,3],F=[4,0],H=foot(B,E,F),Q=[2*H[0]-B[0],2*H[1]-B[1]];return scene({B,E,F,'B′':Q},'B E F B','B′ E;B′ F;B B′','B E F;B′ E F',{circles:[{center:'E',radius:3}],motion:{from:['B','E','F'],to:['B′','E','F'],axis:['E','F']}});})(),
    'EB=5，折叠后EB′可能等于6吗？若折痕绕E转过20°，B′转过多少度？','EB′恒为5，不可能为6。反射点的转角是折痕转角的2倍，因此B′绕E转过40°。');
  add(29,'定弦定角轨迹','最值',[6],['tri-angles','perp-bisector'],true,
    'AB为固定弦，∠ACB=α固定，0°<α<90°，C限定在AB一侧且不取A、B。','C在该侧对应的定角圆弧上；小圆心角∠AOB=2α。',
    ['由圆周角定理，同弦AB所对同侧圆弧上的圆周角相等。','在AB垂直平分线上选圆心O，使小圆心角∠AOB=2α。','在不含小弧AB的那段大弧上取C，圆周角等于α。','反过来，满足定角的同侧点也落在这段圆弧上。另一侧有对称圆弧；端点A、B不能取，且须辨别圆心角取小角还是优角。'],
    scene({A:[-3,0],B:[3,0],O:[0,Math.sqrt(3)],C:[2,Math.sqrt(3)+Math.sqrt(8)]},'A B;A C B','A O B','A O B',{circles:[{center:'O',radius:Math.sqrt(12)}]}),
    'AB=6，∠ACB=60°，求轨迹圆半径。','小圆心角为120°。圆心到弦的垂线平分弦与圆心角，半弦3=R·sin60°，所以R=2√3。此处用到九年级圆与锐角三角函数。');
})();
