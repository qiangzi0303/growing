/* Vector originals contain no image URLs or model credentials. Shared with the portal. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingHandwriting=factory();})(globalThis,()=>{
  'use strict';
  const PREFIX='growing-handwriting-v1:',KEY=/^growing-handwriting-v1:[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
  const WIDTH=800,HEIGHT=1100,MAX_POINTS=18000,MAX_PAGES=8;
  const units=s=>s==='math'?['01','02','03','04','05'].map(n=>'math-8a-'+n).concat(['06','07','08','09','10','11'].map(n=>'math-8b-'+n)):s==='physics'?['01','02','03','04','05'].map(n=>'physics-8a-'+n):s==='english'?Array.from({length:8},(_,i)=>'english-8a-0'+(i+1)):[];
  const str=(v,n)=>typeof v==='string'&&v.length<=n;
  const integer=(v,n)=>Number.isInteger(v)&&v>=0&&v<=n;
  const strings=(v,n,max)=>Array.isArray(v)&&v.length<=n&&v.every(x=>str(x,max));
  const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(v,k));
  const timestamp=v=>str(v,30)&&Number.isFinite(Date.parse(v));
  // IDs and titles mirror the existing course nodes; links never come from a model.
  const knowledgeUnits={
    'math-8a-01':{'tri-lines':'中线、高与角平分线','tri-angles':'三角形内角与外角','tri-inequality':'三角形三边关系',congruence:'全等与对应关系','cong-sss':'边边边判定 SSS','cong-sas':'边角边判定 SAS','cong-asa':'角边角与角角边','cong-hl':'直角三角形 HL','perp-bisector':'线段垂直平分线','angle-bisector':'角平分线的等距性质',isosceles:'等腰三角形',equilateral:'等边三角形'},
    'math-8a-02':{'square-root':'平方根与算术平方根','root-estimate':'估计平方根','cube-root':'立方根','real-types':'有理数与无理数','real-line':'实数与数轴',approximate:'近似值与精确度'},
    'math-8a-03':{pythagoras:'勾股定理','pyth-converse':'勾股定理的逆定理','pyth-apply':'勾股定理的应用'},
    'math-8a-04':{coordinates:'有序数对与坐标',quadrants:'象限与坐标轴',translation:'平移与坐标变化',reflection:'轴对称与坐标变化'},
    'math-8a-05':{'function-variable':'变量、常量与函数','linear-function':'一次函数与正比例函数','line-graph':'一次函数的图象','line-monotone':'一次函数的增减性','line-coefficients':'待定系数求解析式','line-model':'一次函数解决实际问题','line-system':'一次函数与二元一次方程'},
    'math-8b-06':{survey:'普查与抽样调查',charts:'统计图的选择与阅读','price-study':'货比三家：可比的数据',frequency:'频数与频率',histogram:'频数分布表与直方图','vision-study':'视力调查：从数据到结论'},
    'math-8b-07':{'random-event':'必然、不可能与随机事件',probability:'等可能情形下的概率','frequency-prob':'用频率估计概率'},
    'math-8b-08':{parallelogram:'平行四边形的性质','parallel-judge':'平行四边形的判定',rectangle:'矩形',rhombus:'菱形',square:'正方形与特殊四边形关系',midline:'三角形的中位线',trapezoid:'梯形及其面积','iso-trapezoid':'等腰梯形'},
    'math-8b-09':{factor:'提公因式法','factor-concept':'因式分解的概念','factor-difference':'平方差公式分解','factor-perfect':'完全平方公式分解'},
    'math-8b-10':{definition:'分式的定义',meaning:'分式有意义',zero:'分式的值为零',property:'分式基本性质',sign:'分式符号变化',reduce:'分式约分',common:'通分与公分母',add:'分式加减',multiply:'分式乘除',equation:'分式方程',extraneous:'增根与检验'},
    'math-8b-11':{'radical-domain':'二次根式与有意义条件','radical-simplify':'二次根式的性质与化简','radical-multiply':'二次根式的乘除','radical-add':'二次根式的加减'},
    'physics-8a-01':{'phy-source':'声音来自振动','phy-medium':'声音传播需要介质','phy-echo':'声速与回声测距','phy-pitch':'音调由频率决定','phy-loudness':'响度与振幅','phy-timbre':'用音色识别声源','phy-noise':'噪声控制的三个环节','phy-ultrasound':'超声与次声'},
    'physics-8a-02':{'phy-spectrum':'光源与白光的色散','phy-rgb':'三原色光与光能','phy-straight':'光的直线传播与小孔成像','phy-mirror':'平面镜成像的对称性','phy-mirror-lab':'平面镜成像实验','phy-reflection':'反射定律与角度','phy-diffuse':'镜面反射与漫反射'},
    'physics-8a-03':{'phy-refraction':'折射方向与法线','phy-shallow':'水底为何看起来浅','phy-lens':'凸透镜与凹透镜','phy-focus':'焦点、焦距与特殊光线','phy-imaging':'一倍焦距分虚实，二倍分大小','phy-lens-lab':'怎样找到清晰的实像','phy-applications':'照相、投影与放大观察','phy-eye':'人眼成像与视力矫正','phy-instruments':'望远镜与显微镜','phy-invisible':'红外线与紫外线'},
    'physics-8a-04':{'phy-temperature':'三态与温度计的使用','phy-cooling':'读懂温度—时间图像','phy-evaporation':'蒸发与控制变量','phy-boiling':'沸腾需要持续吸热','phy-liquid':'白气、露与液化','phy-melting':'熔化、凝固与平台图像','phy-sublimation':'直接跨过液态的变化','phy-water-cycle':'水循环与状态变化链'},
    'physics-8a-05':{'phy-length':'刻度尺读数与单位','phy-error':'误差不是错误','phy-time':'计时与累积测量','phy-speed':'速度计算与单位换算','phy-uniform':'匀速直线运动与s—t图','phy-average':'平均速度与列车过桥','phy-reference':'先选参照物再说动静'},
    'english-8a-01':{'eng1-reading':'阅读：用事例写出朋友的品质','eng1-forms':'语法：形容词比较级与最高级的构成','eng1-comparison':'语法：比较范围和句型','eng1-suffixes':'词汇运用：-ful / -less 与人物描写'},
    'english-8a-02':{'eng2-reading':'阅读：比较不同的校园生活','eng2-amount':'语法：more / fewer / less','eng2-equality':'语法：as ... as 的同级比较','eng2-writing':'综合运用：建议、语言与学校改进'},
    'english-8a-03':{'eng3-adverbs':'副词比较级与最高级','eng3-reflexives':'反身代词'},
    'english-8a-04':{'eng4-reading':'阅读：从动手失误到学会DIY','eng4-imperatives':'语法：祈使句与操作步骤','eng4-advice':'语法：should / had better','eng4-prefixes':'综合运用：否定前缀与手作介绍'},
    'english-8a-05':{'eng5-reading':'阅读：熊猫成长、困境与保护','eng5-verb-to':'语法：动词 + to不定式','eng5-purpose':'语法：用to不定式表达目的','eng5-object-to':'语法：宾语后带to和不带to的不定式','eng5-writing':'综合运用：保护倡议与构词'},
    'english-8a-06':{'eng6-reading':'阅读：四季诗歌中的意象','eng6-sv-svo':'语法：主谓与主谓宾','eng6-linking':'语法：主系表与感官动词','eng6-weather':'综合运用：天气构词与季节介绍'},
    'english-8a-07':{'eng7-reading':'阅读：生态系统的成员与作用','eng7-double-object':'语法：主谓双宾语','eng7-complement':'语法：主谓宾与宾语补足语','eng7-conjunctions':'语法：and / but / or / so','eng7-writing':'综合运用：-ly与环保建议'},
    'english-8a-08':{'eng8-reading':'阅读：地震叙事的时间线与情绪变化','eng8-past-continuous':'语法：过去进行时','eng8-when-while':'语法：when / while / as','eng8-writing':'综合运用：构词与安全主题叙事'}
  };
  const knowledgeNodes=Object.assign({},...Object.values(knowledgeUnits));
  const nodeUnit=id=>Object.keys(knowledgeUnits).find(unit=>Object.hasOwn(knowledgeUnits[unit],id));
  function knowledgeLink(id){const unit=nodeUnit(id);if(!unit)return null;
    if(unit==='english-8a-03')return '../word-ops-unit3/index.html';
    if(unit.startsWith('english'))return 'english-course.html?unit='+unit+'&node='+encodeURIComponent('lesson:'+id.replace(/^eng\d+-/,''));
    return (unit==='math-8b-10'?'knowledge.html':unit.startsWith('physics')?'physics-course.html':'math-course.html')+'?chapter='+unit+'&node='+encodeURIComponent(id);
  }
  const knowledgeStatus=score=>score===null?'未判定':score<60?'薄弱':score<80?'不稳':'本题通过';
  function knowledge(v){return Array.isArray(v)&&v.length>0&&v.length<=20&&new Set(v.map(k=>k?.nodeId)).size===v.length&&v.every(k=>exact(k,['nodeId','score','feedback'])&&Object.hasOwn(knowledgeNodes,k.nodeId)&&(k.score===null||integer(k.score,100))&&str(k.feedback,1200)&&k.feedback.trim().length>0);}
  function corrections(v){return Array.isArray(v)&&v.length<=40&&v.every(c=>exact(c,['location','issue','correction'])&&['location','issue','correction'].every(k=>str(c[k],1200)&&c[k].trim()));}
  function grade(v){
    return exact(v,['revision','at','score','parts','feedback','needsReview',...['knowledge','source','corrections'].filter(k=>Object.hasOwn(v||{},k))])&&(!Object.hasOwn(v,'source')||v.source==='handwriting'&&corrections(v.corrections)&&(v.needsReview||knowledge(v.knowledge)))&&(!Object.hasOwn(v,'corrections')||v.source==='handwriting'&&corrections(v.corrections))&&(!Object.hasOwn(v,'knowledge')||!v.needsReview&&knowledge(v.knowledge))&&integer(v.revision,1e9)&&timestamp(v.at)&&str(v.feedback,8000)&&typeof v.needsReview==='boolean'&&
      (v.needsReview?v.score===null&&v.parts===null:integer(v.score,100)&&Array.isArray(v.parts)&&v.parts.length===4&&v.parts.every(x=>integer(x,100))&&v.parts.reduce((a,b)=>a+b,0)===v.score);
  }
  function validate(d){
    if(!exact(d,['version','unitId','subject','mode','prompt','pages','revision','recognition','grades','updatedAt'])||d.version!==1||!units(d.subject).includes(d.unitId)||d.mode!==(d.subject==='english'?'essay':'solution')||!str(d.prompt,6000)||!integer(d.revision,1e9)||!timestamp(d.updatedAt)||!Array.isArray(d.pages)||d.pages.length<1||d.pages.length>MAX_PAGES)return false;
    let points=0;
    for(const page of d.pages){
      if(!Array.isArray(page)||page.length>3000)return false;
      for(const s of page){
        if(!exact(s,['tool','width','points'])||!['pen','eraser'].includes(s.tool)||!integer(s.width,40)||s.width<1||!Array.isArray(s.points)||!s.points.length)return false;
        points+=s.points.length;if(points>MAX_POINTS)return false;
        if(!s.points.every(p=>Array.isArray(p)&&p.length===3&&integer(p[0],WIDTH)&&integer(p[1],HEIGHT)&&typeof p[2]==='number'&&Number.isFinite(p[2])&&p[2]>=0&&p[2]<=1))return false;
      }
    }
    const r=d.recognition;
    if(r!==null&&(!exact(r,['revision','text','uncertain','confirmed'])||r.revision!==d.revision||!str(r.text,18000)||!strings(r.uncertain,40,400)||typeof r.confirmed!=='boolean'))return false;
    return Array.isArray(d.grades)&&d.grades.length<=10&&d.grades.every(g=>grade(g)&&(!g.knowledge||g.knowledge.every(k=>nodeUnit(k.nodeId)===d.unitId))&&g.revision<=d.revision&&(!g.needsReview?g.parts.every((p,i)=>p<=(d.mode==='essay'?[25,20,35,20]:[20,30,30,20])[i]):true));
  }
  // Only a complete assessment of this exact bank prompt may label curriculum nodes.
  function matchesKnowledge(g,task){return grade(g)&&task?.nodes?.length>0&&knowledge(g.knowledge)&&g.knowledge.length===task.nodes.length&&g.knowledge.every(k=>task.nodes.includes(k.nodeId));}
  function evidence(documents,tasks){
    const latest=new Map();
    for(const d of documents){
      if(!validate(d)||d.subject!=='math'||d.unitId!=='math-8b-10'||!d.pages.some(p=>p.some(s=>s.tool==='pen')))continue;
      const task=tasks.find(t=>t.prompt===d.prompt&&t.nodes?.length);if(!task)continue;
      for(const g of d.grades){
        if(g.revision!==d.revision||g.needsReview||!matchesKnowledge(g,task)||g.source!=='handwriting'&&(!d.recognition?.confirmed||!d.recognition.text.trim()))continue;
        for(const k of g.knowledge){
          if(k.score===null)continue; // Missing evidence cannot erase an earlier reliable result.
          const prior=latest.get(k.nodeId);if(!prior||Date.parse(g.at)>=Date.parse(prior.at))latest.set(k.nodeId,{...k,at:g.at,taskId:task.id,title:task.title});
        }
      }
    }
    return [...latest.values()];
  }
  function create(subject,unitId,prompt=''){return {version:1,subject,unitId,mode:subject==='english'?'essay':'solution',prompt,pages:[[]],revision:0,recognition:null,grades:[],updatedAt:new Date().toISOString()};}
  function count(d){return d.pages.reduce((sum,page)=>sum+page.reduce((n,s)=>n+s.points.length,0),0);}
  function change(d){if(d.revision>=1e9)throw Error('原稿修订次数已达上限，请新建作业。');d.revision++;d.recognition=null;d.updatedAt=new Date().toISOString();}
  function draw(canvas,strokes){
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,WIDTH,HEIGHT);ctx.lineCap='round';ctx.lineJoin='round';
    for(const s of strokes){ctx.globalCompositeOperation=s.tool==='eraser'?'destination-out':'source-over';ctx.strokeStyle=ctx.fillStyle='#182a3a';
      for(let i=0;i<s.points.length;i++){const p=s.points[i],prev=s.points[Math.max(0,i-1)],w=s.width*(s.tool==='eraser'?1:.35+.65*p[2]);ctx.lineWidth=w;ctx.beginPath();if(i===0){ctx.arc(p[0],p[1],w/2,0,Math.PI*2);ctx.fill();}else{ctx.moveTo(prev[0],prev[1]);ctx.lineTo(p[0],p[1]);ctx.stroke();}}
    }ctx.globalCompositeOperation='source-over';
  }
  return {PREFIX,KEY,WIDTH,HEIGHT,MAX_POINTS,MAX_PAGES,units,validate,grade,create,count,change,draw,knowledgeNodes,knowledgeUnits,nodeUnit,knowledgeLink,knowledgeStatus,matchesKnowledge,evidence};
});
