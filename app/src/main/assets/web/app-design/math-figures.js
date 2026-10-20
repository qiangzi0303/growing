(() => {
  'use strict';
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.GrowingMathFigure=n=>{
    let shapes='',caption='';
    const text=(x,y,value,extra='')=>`<text x="${x}" y="${y}" ${extra}>${esc(value)}</text>`;
    const line=(x1,y1,x2,y2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
    const polygon=points=>`<polygon points="${points}"/>`;
    const axes=()=>line(30,140,325,140)+line(150,215,150,20)+text(326,145,'x')+text(145,15,'y')+text(137,157,'O');
    switch(n.figure){
      case 'triangle':
        if(n.id.startsWith('cong')){
          const hl=n.id==='cong-hl';
          shapes=polygon(hl?'35,45 35,195 145,195':'70,45 25,195 145,195')+polygon(hl?'210,45 210,195 320,195':'245,45 200,195 320,195');
          const points=hl?[[25,30,'A'],[15,215,'B'],[145,215,'C'],[200,30,'D'],[190,215,'E'],[320,215,'F']]:[[65,30,'A'],[8,215,'B'],[145,215,'C'],[240,30,'D'],[183,215,'E'],[320,215,'F']];
          points.forEach(p=>shapes+=text(...p));
          if(hl)shapes+='<path d="M35 181h14v14 M210 181h14v14"/>';
          const conditions={congruence:'△ABC≌△DEF：A↔D、B↔E、C↔F，对应边和角相等。','cong-sss':'SSS示意：AB=DE、BC=EF、AC=DF，三组对应边相等。','cong-sas':'SAS示意：AB=DE、AC=DF、∠A=∠D；角A、D是已知两边的夹角。','cong-asa':'ASA示意：∠A=∠D、∠B=∠E、AB=DE；若改给BC=EF，可用AAS。','cong-hl':'HL示意：∠B=∠E=90°，斜边AC=DF且直角边AB=DE。'};
          caption=conditions[n.id];break;
        }
        if(n.id==='perp-bisector'){
          shapes=line(65,175,295,175)+line(180,35,180,210)+line(180,65,65,175,'stroke-dasharray="4 4"')+line(180,65,295,175,'stroke-dasharray="4 4"')+'<path d="M180 160h15v15"/>'+text(50,195,'A')+text(300,195,'B')+text(165,200,'M')+text(190,60,'P')+text(190,35,'垂直平分线');
          caption='M为AB中点，PM⊥AB；垂直平分线上的点P满足PA=PB。';break;
        }
        if(n.id==='angle-bisector'){
          shapes=line(50,180,310,180)+line(50,180,250,30)+line(50,180,290,100)+line(200,130,200,180,'stroke-dasharray="4 4"')+line(200,130,170,90,'stroke-dasharray="4 4"')+text(30,200,'O')+text(313,185,'A')+text(250,25,'B')+text(207,130,'P')+text(200,200,'E')+text(151,84,'F');
          caption='OP平分∠AOB；PE、PF是到两边的垂线段，PE=PF。';break;
        }
        if(n.id==='tri-inequality'){
          shapes=line(65,55,185,55)+line(65,115,225,115)+line(65,175,265,175)+text(115,45,'3')+text(140,105,'4')+text(160,165,'5')+text(80,220,'3+4>5，可以组成三角形');
          caption='先比较两短边之和与最长边：严格大于才可组成三角形。';break;
        }
        if(['isosceles','equilateral'].includes(n.id)){
          shapes=polygon('180,30 70,220 290,220')+text(173,22,'A')+text(48,236,'B')+text(300,236,'C')+text(105,113,'AB=AC');
          if(n.id==='equilateral'){shapes+=text(150,205,'BC=AB')+text(165,75,'60°');caption='等边三角形三边相等，三个内角均为60°。';}
          else{shapes+=text(165,75,'40°')+text(100,206,'70°')+text(233,206,'70°');caption='等腰三角形AB=AC，顶角40°时，两底角均为70°。';}break;
        }
        if(n.id==='tri-angles'){
          shapes=polygon('150,35 60,190 300,190')+line(300,190,345,190)+text(138,23,'A')+text(45,208,'B')+text(297,208,'C')+text(135,78,'60°')+text(82,179,'50°')+text(240,179,'70°')+text(300,165,'110°');
          caption='内角和60°+50°+70°=180°；C处外角110°=60°+50°。';break;
        }
        shapes=polygon('150,35 60,190 300,190')+line(150,35,180,190,'stroke-dasharray="5 4"')+text(145,24,'A')+text(42,207,'B')+text(307,207,'C')+text(175,210,'D')+text(103,181,'中点两侧相等');
        caption='示意：AD是中线，BD=DC；中线不一定是高或角平分线。';break;
      case 'right':
        shapes=polygon('75,45 75,195 275,195')+`<path d="M75 180h15v15"/>`+text(48,122,'3')+text(167,220,'4')+text(180,110,'5')+text(120,35,'直角对着斜边');
        caption='3、4、5直角三角形：3²+4²=5²，最长边5是斜边。';break;
      case 'numberline':
        if(n.id==='cube-root')return '<figure class="lesson-figure formula-figure"><div>∛(−8) = −2<br>(−2)³ = −8</div><figcaption>负数也有唯一的实数立方根；不要写成±2。</figcaption></figure>';
        if(n.id==='approximate')return '<figure class="lesson-figure formula-figure"><div>3.14159 <span>→</span> 3.14<br>2.995 <span>→</span> 3.00</div><figcaption>精确到0.01，看千分位四舍五入；末尾的0不能随意省去。</figcaption></figure>';
        shapes=line(25,130,335,130);
        for(let i=-3;i<=3;i++)shapes+=line(180+i*40,124,180+i*40,136)+text(174+i*40,159,i);
        shapes+=`<circle cx="236.57" cy="130" r="6"/>`+text(220,105,'√2');
        caption='√2在1与2之间，数轴上的点也可以表示无理数。';break;
      case 'coordinate':
        shapes=axes()+line(200,65,200,140,'stroke-dasharray="4 4"')+line(150,65,200,65,'stroke-dasharray="4 4"')+`<circle cx="200" cy="65" r="5"/>`+text(208,58,'P(2,3)')+text(194,159,'2')+text(128,70,'3');
        caption='点P(2,3)：横坐标先写，纵坐标后写；到x轴距离3，到y轴距离2。';break;
      case 'line':
        shapes=axes()+line(65,200,240,25)+`<circle cx="150" cy="115" r="4"/><circle cx="200" cy="65" r="4"/>`+text(157,119,'(0,1)')+text(206,66,'(2,3)')+text(40,40,'y=x+1');
        caption='例：y=x+1经过(0,1)、(2,3)，从左向右上升。';break;
      case 'bars':
        shapes=line(40,200,320,200)+line(40,200,40,40)+text(12,30,'频数');
        [2,5,3].forEach((v,i)=>{const x=75+i*80;shapes+=`<rect x="${x}" y="${200-v*25}" width="45" height="${v*25}"/>`+text(x+17,190-v*25,v)+text(x+17,225,'ABC'[i]);});
        caption='示例：A、B、C频数为2、5、3，总数10；B的频率为5/10=0.5。';break;
      case 'chance':
        [0,1,2,3,4].forEach((v,i)=>{const x=60+i*60;shapes+=`<circle cx="${x}" cy="115" r="22" style="fill:${i<3?'#b8755e':'#f4e9b8'}"/>`+text(x-7,122,i<3?'红':'白',i<3?'':'style="fill:#20331e"');});
        caption='5个球除颜色外相同、等可能摸到时，红球概率为3/5。';break;
      case 'parallel':{
        let points='100,60 290,60 240,190 50,190';
        caption='一般平行四边形：对角线互相平分，不一定相等或垂直。';
        if(n.id==='rectangle'){points='70,50 290,50 290,200 70,200';caption='矩形：四角都是直角，对角线相等且互相平分。';}
        if(n.id==='rhombus'){points='180,25 280,120 180,215 80,120';caption='菱形：四边相等，对角线垂直且互相平分。';}
        if(n.id==='square'){points='100,40 260,40 260,200 100,200';caption='正方形：四边相等、四角直角，对角线相等且垂直平分。';}
        if(n.id.includes('trapezoid')){points='120,55 240,55 310,195 50,195';caption='梯形示意：上、下底平行，高是两底间的垂直距离；本图为等腰梯形。';}
        if(n.id==='midline'){shapes=polygon('150,35 60,195 300,195')+line(105,115,225,115)+text(92,108,'D')+text(232,108,'E')+text(40,213,'B')+text(305,213,'C')+text(147,25,'A');caption='D、E为两边中点，DE∥BC，DE=BC/2。';break;}
        shapes=polygon(points);const ps=points.split(' ').map(s=>s.split(',').map(Number));
        if(!n.id.includes('trapezoid'))shapes+=line(...ps[0],...ps[2],'stroke-dasharray="5 4"')+line(...ps[1],...ps[3],'stroke-dasharray="5 4"');
        ps.forEach((p,i)=>{shapes+=text(p[0]+(i===1||i===2?8:-18),p[1]+(i<2?-10:18),'ABCD'[i]);});break;
      }
      case 'radical':return '<figure class="lesson-figure formula-figure"><div>√72 <span>→</span> √(36×2) <span>→</span> 6√2</div><figcaption>示例：把完全平方因子36提出根号。加减运算仍需先判断是否同类。</figcaption></figure>';
      default:return `<figure class="lesson-figure formula-figure"><div>${esc(n.example)}</div><figcaption>把式子从左到右逐步改写，每一步都要依据等式或运算法则。</figcaption></figure>`;
    }
    return `<figure class="lesson-figure"><svg viewBox="0 0 360 245" role="img" aria-label="${esc(caption)}">${shapes}</svg><figcaption>${esc(caption)}（示意图，不作为测量或证明依据。）</figcaption></figure>`;
  };
})();
