// Browser adaptation of Math-To-Manim's shot/term grammar; geometry is original.
// Sources and scope: docs/plans/2026-11-28-math-to-manim-review.md.
export const mathProofStories={
 'factor-difference':{
  title:'剪开再拼，两个因式就出现了',question:'去掉小正方形，剩下的面积还能怎样计算？',
  lesson:{
   definitions:[['因式分解','把一个多项式化成几个整式的积的形式，叫做因式分解。它与整式乘法的方向相反。'],['平方差公式','两个数的平方差，等于这两个数的和与这两个数的差的积。']],
   formula:'a² − b² = (a + b)(a − b)',
   symbols:'a、b 可以代表数，也可以代表整式。例如 4x²−9=(2x)²−3²，把 2x 和 3 分别看作公式中的 a、b，得到 (2x+3)(2x−3)。',
   condition:'公式对任意实数 a、b 都成立。下面用长度表示 a、b，为了从大正方形中剪去小正方形，取 a>b>0；这个剪拼条件不是公式本身的限制。',
   key:'先找公因式，再检查能否写成“一个平方减另一个平方”。分解后要写成整式的积，并继续检查是否还能分解。',
   mistake:'a²−b² 不是 (a−b)²；a²+b² 也不能套用平方差公式。平方、减号和两个因式都不能漏。',
   bridge:'下面把同一块剩余面积分别写成“平方差”和“长×宽”，看两个因式怎样出现。'
  },
  shots:[['看两个正方形','大正方形边长为 a，小正方形边长为 b，先取 a > b > 0。'],['拿走小正方形','去掉 b²，剩下一个 L 形；沿虚线剪成两块。'],['转动，再拼合','蓝色块平移，橙色块旋转90°；两块都没有拉伸，面积不变。'],['读出长与宽','拼成长 a+b、宽 a−b 的长方形，因此 a²−b²=(a+b)(a−b)。']],
  controls:[{key:'a',label:'大正方形边长 a',min:3,max:6,step:.5,value:5},{key:'ratio',label:'小正方形与大正方形边长比 b/a',min:.2,max:.8,step:.1,value:.6}],
  note:'面积剪拼取 a>b>0。对任意实数 a、b，展开 (a+b)(a−b)=a²−ab+ab−b²，也可证明平方差恒等式。',
 },
 pythagoras:{
  title:'同样四块，留下的面积相等',question:'同一个大正方形，放入同样的四个三角形，还剩多少？',
  lesson:{
   definitions:[['直角三角形','有一个角是直角（90°）的三角形，叫做直角三角形。'],['直角边与斜边','夹着直角的两条边叫直角边；直角所对的边叫斜边，斜边是这个三角形中最长的边。'],['勾股定理','直角三角形两条直角边的平方和，等于斜边的平方。']],
   formula:'a² + b² = c²',
   symbols:'a、b 表示两条直角边的长，c 表示斜边的长。a²、b²、c² 也分别是以这三条边为边长的正方形的面积。',
   condition:'先根据已知条件确认直角，再找直角所对的斜边。边长均为正数；从边长的平方求边长时，取算术平方根。',
   key:'求斜边用 c²=a²+b²；求直角边可用 a²=c²−b²。例如直角边为 6、8，则 c²=36+64=100，c=10。',
   mistake:'不能把公式写成 a+b=c，也不能对任意三角形直接套用。若要由三边关系判断直角，需使用下一节的勾股定理逆定理。',
   bridge:'下面用相同的四个直角三角形作两种摆法，从相同外框中减去相同面积，说明为什么 c²=a²+b²。'
  },
  shots:[['先确认直角','a、b 是直角边，c 是斜边。下面的四块都是这个直角三角形。'],['围出一个正方形','四个三角形围住的四边都长 c。两锐角和为90°，所以中间的四个角也都是直角。'],['平移同样四块','把同样的四个三角形重新摆放：只平移，不改变形状和大小。'],['比较剩余面积','外框同为边长 a+b 的正方形，减去同样四块，剩余面积相等：c²=a²+b²。']],
  controls:[{key:'a',label:'直角边 a',min:1,max:5,step:.5,value:3},{key:'b',label:'直角边 b',min:1,max:5,step:.5,value:4}],
  note:'每块三角形面积为 ab/2；两种摆法都从 (a+b)² 中减去 4×ab/2。图中的直角条件和面积关系适用于任意正的 a、b，数值只是例子。',
 },
};
export const proofNodeIds=Object.keys(mathProofStories);
export const proofDefaults=id=>Object.fromEntries(mathProofStories[id].controls.map(c=>[c.key,c.value]));
const clamp=x=>Math.max(0,Math.min(1,x));
const mix=(a,b,t)=>a+(b-a)*t;
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
export function rigid(points,x,y,angle=0){
 const r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
 return points.map(([px,py])=>[x+px*c-py*s,y+px*s+py*c]);
}
export function proofState(id,values={},progress=0){
 const story=mathProofStories[id];if(!story)throw Error('未知数学分幕');
 const v={...proofDefaults(id),...values};
 for(const c of story.controls)if(!Number.isFinite(v[c.key])||v[c.key]<c.min||v[c.key]>c.max)throw Error('参数超出范围');
 if(!Number.isFinite(progress))throw Error('进度无效');
 const p=clamp(progress),stage=Math.min(3,Math.floor(p*4)),t=clamp((p-.5)*4),a=v.a;
 if(id==='factor-difference'){
  const b=a*v.ratio,d=a-b,offset=1.8*a;
  const bottom=rect(0,b,a,d),top=rect(-d/2,-b/2,d,b);
  const moveBase=clamp(t/.3),lift=clamp((t-.3)/.25),turn=clamp((t-.55)/.2),drop=clamp((t-.75)/.25);
  let cx=mix(d/2,1.5*a,lift),cy=mix(b/2,-.2*a,lift);
  cx=mix(cx,offset+a+b/2,turn);cy=mix(cy,b+d/2,drop);
  return {p,stage,a,b,d,offset,scale:190/a,outer:a*a,removed:b*b,remaining:a*a-b*b,
   cut:rect(d,0,b,b),base:rigid(bottom,offset*moveBase,0),piece:rigid(top,cx,cy,90*turn),
   source:[bottom,rigid(top,d/2,b/2)],frame:rect(offset,b,a+b,d),
  };
 }
 const b=v.b,L=a+b,offset=1.9*L,triangle=[[0,0],[a,0],[0,b]];
 const starts=[[0,0],[L,0],[L,L],[0,L]],ends=[[0,a],[L,0],[a,L],[a,a]];
 return {p,stage,a,b,L,offset,scale:220/L,c:Math.hypot(a,b),outer:L*L,removed:2*a*b,remaining:a*a+b*b,
  triangle,source:starts.map(([x,y],i)=>rigid(triangle,x,y,i*90)),
  pieces:starts.map(([x,y],i)=>rigid(triangle,offset+mix(x,ends[i][0],t),mix(y,ends[i][1],t),i*90)),
  center:[[a,0],[L,a],[b,L],[0,b]],squares:[rect(offset,0,a,a),rect(offset+a,a,b,b)],
 };
}
