/* Reviewed against the two local photographs. Never infer a missing question or a student's cloud attempt. */
(()=>{
 'use strict';
 const rows=[
 [1,'math-8a-01','三角形三边关系',['tri-inequality'],String.raw`下列长度的三条线段可以组成三角形的是（　）。
A. \(2,3,4\)　B. \(5,6,12\)　C. \(1,5,9\)　D. \(2,5,7\)`],
 [2,'math-8b-10','分式的识别',['definition'],String.raw`下列各式：\(\frac{7}{a}\)，\(\frac{a+b}{7}\)，\(\frac{x^2+y^2}{x+y}\)，\(3-\frac{x}{2}\) 中，分式共有（　）。
A. 1个　B. 2个　C. 3个　D. 4个`, '第三个式子分母末字母被手写笔迹遮挡，暂按可见字形转录为 y，需对照清晰原卷核对。'],
 [3,'math-8b-09','因式分解的定义',['factor-definition'],String.raw`下面各式从左到右的变形，属于因式分解的是（　）。
A. \(x(x-1)=x^2-x\)
B. \(x^2-x=x(x-1)\)
C. \(x^2-x-1=x(x-1)-1\)
D. \(x^2-1=(x-1)^2\)`],
 [4,'math-8a-01','等腰三角形与高线求角',['isosceles','triangle-angles'],String.raw`如图，\(AD\)、\(BE\) 是 \(\triangle ABC\) 的高，\(AB=AC\)，\(\angle BAC=50^\circ\)，则 \(\angle BED\) 的度数为（　）。
A. \(40^\circ\)　B. \(25^\circ\)　C. \(22.5^\circ\)　D. \(30^\circ\)`],
 [5,'math-8a-03','长方体体对角线与勾股定理',['pythagoras','space-diagonal'],String.raw`如图，一个长方体形状的饮料盒的底面长为 \(4\,\mathrm{cm}\)，宽为 \(3\,\mathrm{cm}\)，高为 \(12\,\mathrm{cm}\)，在它的一角处开一个插吸管的小孔，将一根吸管最大限度插入盒中，露在外面的长度为 \(1\,\mathrm{cm}\)，则此吸管的总长度为（　）。
A. \(12\,\mathrm{cm}\)　B. \(13\,\mathrm{cm}\)　C. \(14\,\mathrm{cm}\)　D. \(15\,\mathrm{cm}\)`],
 [6,'math-8b-09','分组分解与整体代入',['factor-group','substitution'],String.raw`已知 \(a-b=5\)，\(b-c=-6\)，则代数式 \(a^2-ac-b(a-c)\) 的值为（　）。
A. \(-30\)　B. \(30\)　C. \(-5\)　D. \(-6\)`],
 [7,'math-8b-10','分式方程参数范围与增根检验',['equation','extraneous','inequality'],String.raw`已知关于 \(x\) 的分式方程 \(\frac{x}{x-3}-2=\frac{m}{3-x}\) 的解为非负数，则 \(m\) 的取值范围是（　）。
A. \(m\geq-6\) 且 \(m\neq-3\)
B. \(m\geq-6\)
C. \(m\leq-6\)
D. \(m\leq-6\) 且 \(m\neq-3\)`],
 [8,'math-8a-01','角平分线与面积关系',['angle-bisector','area','congruence'],String.raw`如图，\(\triangle ABC\) 的面积为 \(16\)，\(AD\) 平分 \(\angle BAC\)，且 \(AD\perp BD\) 于点 \(D\)，则 \(\triangle ADC\) 的面积是（　）。
A. \(6\)　B. \(8\)　C. \(10\)　D. \(12\)`],
 [9,'math-8b-10','分式有意义的条件',['meaning'],String.raw`若分式 \(\frac{1}{x-3}\) 有意义，则 \(x\) 的取值范围是 ______。`],
 [10,'math-8b-09','完全平方公式与参数匹配',['perfect-square'],String.raw`若 \(x^2-mx+9\) 能用完全平方公式进行因式分解，则 \(m\) 的值为 ______。`],
 [11,'math-8a-01','角平分线等距性质与点到直线距离',['angle-bisector','distance','right-triangle'],String.raw`如图，\(\angle AOB=60^\circ\)，\(OP\) 平分 \(\angle AOB\)，\(PM\perp OB\) 于点 \(M\)，点 \(N\) 是射线 \(OA\) 上的一个动点，若 \(OP=4\)，则线段 \(PN\) 长的最小值是 ______。`],
 [12,'math-8b-10','由数量关系建立分式方程',['equation','meaning'],String.raw`当 \(x=\) ______ 时，分式 \(\frac{2x}{x-1}\) 的值比分式 \(\frac{x-1}{x}\) 的值大 \(1\)。`],
 [13,'math-8a-01','直角三角形斜边中线与周长',['hypotenuse-midpoint','perimeter'],String.raw`如图，\(BE\)、\(CF\) 分别是 \(\triangle ABC\) 的高，\(M\) 为 \(BC\) 的中点，\(EF=6\)，\(BC=8\)，则 \(\triangle EFM\) 的周长是 ______。`],
 [14,'math-8a-01','角平分线与垂直平分线综合',['angle-bisector','perp-bisector','congruence'],String.raw`如图，已知 \(\angle BAC\) 的平分线与 \(BC\) 的垂直平分线相交于点 \(D\)，\(DE\perp AB\)，\(DF\perp AC\)，垂足分别为 \(E\)、\(F\)，\(AB=6\)，\(AC=3\)，则 \(BE=\) ______。`],
 [15,'math-8a-01','格点中的直角三角形计数',['right-triangle','grid-count'],String.raw`如图为一张藏宝图，有一人想出发寻宝，已知秘密宝藏藏在图中的某个黑点标示的位置，经过调查，秘密宝藏的位置 \(P\) 满足条件：\(\triangle PAB\) 为直角三角形，符合条件的 \(P\) 点的个数为 ______ 个。`],
 [16,'math-8b-09','因式分解与实数混合运算',['factor-common','difference-square','perfect-square','real-power'],String.raw`（9分）分解因式：
（1）\(2x^2-8\)；
（2）\(x^3y-2x^2y^2+xy^3\)。
（3）计算：\(\sqrt{4}+(2023-\sqrt{3})^0-\left(\frac{1}{3}\right)^{-1}\)。`],
 [17,'math-8b-10','分式加减与乘除混合运算',['add','multiply','reduce'],String.raw`（6分）计算：
（1）\(\frac{2m+1}{m-1}+\frac{m-4}{m-1}\)；
（2）\(\frac{y^2}{x-y}\cdot\frac{2x-2y}{x}\div\frac{4y}{x}\)。`],
 [18,'math-8b-10','分式化简求值与取值限制',['add','multiply','reduce','meaning'],String.raw`（6分）先化简：\(\left(\frac{x-1}{x+1}+\frac{2x}{x^2-1}\right)\div\frac{1}{x^2-1}\)，再从 \(-1\)、\(0\)、\(1\) 中选一个合适的 \(x\) 的值代入求值。`],
 [20,'math-8a-01','尺规作图与垂直平分线性质',['construction','perp-bisector','isosceles','parallel-angles'],String.raw`（6分）已知：如图，射线 \(BA\) 和射线 \(BC\) 有公共端点 \(B\)。
（1）①作线段 \(BC\) 的垂直平分线，交射线 \(BA\) 于点 \(P\)；
②过 \(P\) 作射线 \(PD\)，使 \(PD\parallel BC\)。
（以上按要求尺规作图，并保留作图痕迹。）
（2）若 \(\angle APD=34^\circ\)，连接 \(PC\)，则 \(\angle BCP=\) ______。`],
 [21,'math-8b-10','等时搬运问题的分式方程建模',['equation','word-problem','extraneous'],String.raw`（6分）人工智能在物流行业有广泛的应用，其中自主移动机器人可以实现高效的搬运和拣货作业。某物流园区利用 \(A\)、\(B\) 两种自主移动机器人搬运化工原料，\(A\) 型机器人比 \(B\) 型机器人每小时多搬运 \(10\,\mathrm{kg}\)，\(A\) 型机器人搬运 \(800\,\mathrm{kg}\) 所用时间与 \(B\) 型机器人搬运 \(600\,\mathrm{kg}\) 所用时间相等，两种机器人每小时分别搬运多少化工原料？`],
 [22,'math-8a-01','双角平分线交点求角与线段相等证明',['angle-bisector','triangle-angles','congruence'],String.raw`（6分）如图，在 \(\triangle ABC\) 中，\(\angle ABC=40^\circ\)，\(\angle ACB=80^\circ\)。点 \(D\)、\(E\) 分别在 \(AC\)、\(AB\) 上，\(BD\)、\(CE\) 分别是 \(\angle ABC\)、\(\angle ACB\) 的平分线，\(BD\)、\(CE\) 交于点 \(F\)。
（1）求 \(\angle DFE\) 的度数；
（2）求证：\(EF=DF\)。`],
 [23,'math-8b-09','配方法阅读迁移与非负性',['perfect-square','completing-square','nonnegative','factor-group'],String.raw`（8分）【阅读理解，自主探究】把代数式通过配凑等手段，得到完全平方式，再运用完全平方公式是非负数这一性质增加问题的条件，这种解题方法叫做配方法。配方法在代数式求值、解方程、最值问题等都有着广泛的应用。
例1：因式分解：\(a^2+6a+8\)。
解：原式\(=a^2+6a+9-1=(a+3)^2-1=(a+3-1)(a+3+1)=(a+2)(a+4)\)。
例2：若 \(M=a^2-2ab+2b^2-2b+2\)，利用配方法求 \(M\) 的最小值。
解：\(a^2-2ab+2b^2-2b+2=a^2-2ab+b^2+b^2-2b+1+1=(a-b)^2+(b-1)^2+1\)。
因为 \((a-b)^2\geq0\)，\((b-1)^2\geq0\)，所以当 \(a=b=1\) 时，\(M\) 有最小值 \(1\)。
请根据上述阅读材料，解决下列问题：
（1）用配方法因式分解：\(a^2-12a+35\)；
（2）若 \(M=a^2-3a+1\)，则 \(M\) 的最小值为 ______；
（3）已知 \(a^2+2b^2+c^2-2ab+4b-6c+13=0\)，求 \(a+b+c\) 的值。`],
 [24,'math-8a-01','特殊直角三角形与倍角关系证明',['right-triangle','hypotenuse-midpoint','isosceles','angle-bisector','triangle-angles'],String.raw`（8分）【问题引入】
（1）如图①，\(\triangle ABC\) 中，\(\angle B=60^\circ\)，\(\angle C=30^\circ\)，过点 \(A\) 作 \(AD\perp BC\)，垂足为点 \(D\)。若 \(AB=2\)，则 \(BD=\) ______；\(CD=\) ______。
【类比探究】
（2）如图②，\(\triangle ABC\) 中，\(\angle BAC=75^\circ\)，过点 \(A\) 作 \(AD\perp BC\)，垂足为点 \(D\)，且 \(BD<CD\)。若 \(AB+BD=CD\)，求 \(\angle C\) 的度数。
【拓展应用】
（3）如图③，\(\triangle ABC\) 中，\(\angle B=2\angle C\)，\(AE\) 平分 \(\angle BAC\)，交 \(BC\) 于点 \(E\)。求证：\(AB+BE=AC\)。`]
 ];
 const evidence={8:'选择题有明显错选与批改痕迹。',11:'填空答案与距离模型不符，需复习垂线段最短。',13:'手写周长与题设复核不符，需检查两直角三角形中斜边中线的性质。',17:'第（2）问有错误及扣分痕迹；第（1）问不据此判错。',18:'可见扣分痕迹；化简、取值与最终求值需重新独立核对。',22:'第（2）问证明有修改和部分得分痕迹；第（1）问不据此判错。',23:'三小问有明显错误或未完成痕迹，列为重点复习。',24:'第（1）问第二空及第（2）问有错误；第（3）问证明需补全。'};
 const source='文景实验学校八年级上数学期中复习卷（1）';
 const questions=rows.map(([number,unitId,title,concepts,text,note=''])=>({id:`midterm-20261029-${String(number).padStart(2,'0')}`,number,page:number<=11?1:number<=20?2:number<=23?3:4,unitId,unitIds:number===16?[unitId,'math-8a-02']:[unitId],title,concepts,text,format:'math-text-v1',sourceId:'midterm-20261029',sourceLabel:source,note,review:evidence[number]||'仅收录考查知识点；未凭照片认定本题做错。',priority:!!evidence[number],figure:[4,5,8,11,13,14,15,20,22,24].includes(number)?`math-midterm-figures/q${number}.svg`:null}));
 questions.find(q=>q.number===7).review='学生所选选项与按现有题面独立复核一致；旁侧批改痕迹需核对，暂不认定本题做错。';
 window.GrowingMidterm={source,questions,missing:[19],version:1};
 const bank=window.GrowingMathWrongQuestions;
 if(bank){
  if(!bank.units.some(u=>u.id==='math-8a-03'))bank.units.splice(2,0,{id:'math-8a-03',title:'勾股定理',term:'八年级上册'});
  bank.questions.push(...questions.filter(q=>!bank.questions.some(old=>old.id===q.id)));
 }
})();
