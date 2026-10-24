/* Original educational exercises and self-observation prompts; no norm-based IQ scoring. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GrowingAssessment=api;})(typeof globalThis==='object'?globalThis:this,()=>{
  'use strict';
  const VERSION=1,KEY='growing-assessment-v1';
  const ages=[{id:'12-14',label:'12–14 岁',context:'学习与校园'},{id:'15-17',label:'15–17 岁',context:'学习与自主规划'},{id:'18+',label:'18 岁及以上',context:'学习、工作与生活'}];
  const kinds={
    thinking:{title:'思维探索',subtitle:'找规律，也练习说清理由',minutes:'约 6–10 分钟',dimensions:[['pattern','规律推理'],['logic','逻辑判断'],['space','空间与数量']]},
    emotion:{title:'情绪与社交',subtitle:'觉察情绪，理解自己与他人',minutes:'约 5–8 分钟',dimensions:[['awareness','情绪觉察'],['regulation','自我调节'],['motivation','内在动力'],['empathy','理解他人'],['cooperation','沟通合作']]},
    balance:{title:'成长四象限',subtitle:'看看生活中哪些方面值得照顾',minutes:'约 4–6 分钟',dimensions:[['learning','学习与思考'],['body','身体与作息'],['meaning','兴趣与意义'],['action','关系与行动']]}
  };
  const advice={
    pattern:['把相邻两项的变化写下来，再用下一项验证规律。','每周选两道不同类型的规律题，比较不同解法。'],
    logic:['用表格列出条件，区分“有些”“所有”和“不能确定”。','试着举反例检验结论，把推理依据讲给同伴听。'],
    space:['先画图、标方向或列举小情况，再检查有没有漏数。','把图形题的分类计数方法用到更大的图形中。'],
    awareness:['每天用一个词记录情绪，再写下触发它的一件事。','留意同一种情绪在不同情境里的变化，并说清自己的需要。'],
    regulation:['情绪强烈时先停十秒、慢呼吸，再决定下一步。','把已经有效的调节方法记下来，压力来时主动使用。'],
    motivation:['把一个想做的目标拆成今天能完成的十分钟行动。','回顾坚持做某件事的原因，为过程而非只为结果记录进步。'],
    empathy:['先复述对方的感受，再询问“我理解得对吗”。','在表达自己前，试着列出对方可能在意的一件事。'],
    cooperation:['用“我感到……我希望……”练习一次清楚的表达。','在合作前明确分工，并留出彼此反馈的时间。'],
    learning:['每天留十分钟，回顾一个没弄懂的问题并主动求证。','把学到的方法用到一个新问题中，再向别人解释。'],
    body:['从固定起床时间或每天一次轻松活动中选一项开始。','观察精力与作息的关系，保留适合自己的休息节奏。'],
    meaning:['每周留一小段时间，做一件让你好奇而非只为得分的事。','为喜欢的活动留出固定时间，记录它带来的感受与发现。'],
    action:['选择一个小承诺，说明何时完成，完成后主动反馈。','在行动中邀请反馈，也给重要关系留出倾听的时间。']
  };
  const q=(id,dimension,prompt,options,answer,explanation,visual)=>({id,dimension,prompt,options,answer,explanation,...(visual?{visual}:{})});
  function thinking(age){
    const older=age!=='12-14',adult=age==='18+';
    return [
      q('p1','pattern',adult?'按同一规律：2，6，12，20，下一项是？':older?'按同一规律：3，7，15，31，下一项是？':'按同一规律：2，5，8，11，下一项是？',adult?['26','28','30','32']:older?['47','62','63','64']:['12','13','14','15'],2,adult?'相邻差依次为4、6、8，下一个差为10，所以是30。':older?'每次乘2再加1，31×2+1=63。':'每次增加3，11+3=14。'),
      q('p2','pattern','按字母表顺序找规律：A，C，F，J，下一项是？',['L','M','N','O'],3,'字母序号为1、3、6、10，间隔为2、3、4，下一次加5得到15，即O。'),
      q('p3','pattern','图形按三个一组重复：△ ○ ○ △ ○ ○ △ ？',['△','○','□','◇'],1,'每组是“△ ○ ○”，第8个图形处于每组的第二个位置，因此是圆形。','sequence'),
      q('p4','pattern',adult?'对应规则相同：1→2，2→5，3→10，4→17，那么6→？':older?'对应规则相同：2→6，3→12，4→20，那么5→？':'对应规则相同：3→10，5→16，7→22，那么9→？',adult?['25','30','36','37']:older?['25','28','30','35']:['25','26','27','28'],adult?3:older?2:3,adult?'右边等于左边的平方加1，6²+1=37。':older?'右边等于n×(n+1)，5×6=30。':'右边等于左边乘3再加1，9×3+1=28。'),
      q('l1','logic','小安比小白高，小白比小陈高。谁最高？',['小安','小白','小陈','无法确定'],0,'高矮顺序为小安、小白、小陈，因此小安最高。'),
      q('l2','logic','所有A类卡片都是蓝色，有些蓝色卡片是圆形。能否确定有A类卡片是圆形？',['一定有','一定没有','所有A类都是圆形','不能确定'],3,'“有些蓝色”可能属于A类，也可能不属于。现有条件不能确定交集。'),
      q('l3','logic','小安、小白、小陈各选红、绿、蓝中的一种，颜色互不相同。小安不选红也不选绿，小白不选绿。谁选绿色？',['小安','小白','小陈','无法确定'],2,'小安只能选蓝；小白不能选绿且蓝已选，只能选红；小陈选绿。'),
      q('l4','logic','约定“这个周六如果下雨，就去图书馆”。约定被严格遵守，周六没有去图书馆。可以推出什么？',['周六没有下雨','周六一定下雨','周六去了公园','图书馆没有开放'],0,'如果下雨就必须去图书馆；既然没去，便不可能下雨。不能由此推断去了哪里。'),
      q('s1','space','一个长方形长5厘米、宽3厘米，周长是多少？',['8厘米','15厘米','16厘米','30厘米'],2,'周长为(5+3)×2=16厘米。面积与周长不要混淆。'),
      q('s2','space','起初面朝北，向右转90°，再向左转180°。最后面朝哪个方向？',['北','东','南','西'],3,'朝北右转后面朝东，再左转180°，最后面朝西。'),
      q('s3','space',`一个大正方形被均分为${adult?'4×4':older?'3×3':'2×2'}个小正方形。沿网格线能找到的所有大小正方形一共有多少个？`,adult?['16','20','29','30']:older?['9','10','14','18']:['4','5','6','8'],adult?3:older?2:1,adult?'按边长分类：16个小正方形、9个2×2、4个3×3、1个4×4，共30个。':older?'按边长分类：9个小正方形、4个2×2、1个3×3，共14个。':'4个小正方形加1个大正方形，共5个。',adult?'grid4':older?'grid3':'grid2'),
      q('s4','space',adult?'袋子里有4个红球和4个蓝球，不看颜色且不放回。至少拿几个，才能保证有3个同色球？':'袋子里有3个红球和3个蓝球，不看颜色且不放回。至少拿几个，才能保证有2个同色球？',adult?['3个','4个','5个','6个']:['2个','3个','4个','5个'],adult?2:1,adult?'最不利时先拿到2红2蓝；第5个无论什么颜色，都使一种颜色达到3个。':'先拿2个可能一红一蓝；第3个无论哪种颜色，都会与其中一个同色。')
    ];
  }
  const emotionItems=[
    ['awareness','我能分清自己是生气、委屈、紧张，还是疲惫。'],['awareness','情绪变化时，我能找到可能触发它的具体事情。'],['awareness','我常要等情绪过去，才发现自己刚才很难受。',true],['awareness','我能用语言向信任的人说明自己的感受与需要。'],
    ['regulation','情绪很强烈时，我会先暂停一下，再回复或行动。'],['regulation','遇到不顺心的事，我容易立刻把气发在别人身上。',true],['regulation','我有能帮助自己平静下来的办法，例如走动、呼吸或倾诉。'],['regulation','做得不理想时，我能在休息后重新尝试。'],
    ['motivation','我能说出自己努力做一件事的原因。'],['motivation','没有别人提醒时，我也会推进自己选定的小目标。'],['motivation','一旦短时间看不到成果，我就会把目标完全搁置。',true],['motivation','遇到困难时，我会调整方法，或主动寻求帮助。'],
    ['empathy','别人表达不满时，我会先听完，试着理解对方。'],['empathy','我能想到同一件事可能让不同的人有不同感受。'],['empathy','我常没听清缘由，就认定对方是在小题大做。',true],['empathy','我不确定别人感受时，会询问，而不是直接下结论。'],
    ['cooperation','有分歧时，我能说出理由，也愿意听对方的理由。'],['cooperation','合作前，我会和同伴确认分工与完成时间。'],['cooperation','为了避免冲突，我常把重要的需要一直藏在心里。',true],['cooperation','我能在尊重对方的同时，说清自己的界限。']
  ];
  const balanceItems=[
    ['learning','我会回顾刚学到的内容，并找出还不明白的地方。'],['learning','面对不同意见，我愿意查证，而不只是坚持原来的想法。'],['learning','我会把新方法用到实际问题中，看看是否有效。'],['learning','遇到不会的问题，我通常直接绕开，不再回头。',true],
    ['body','我的作息大体有规律，醒来后通常有精力。'],['body','我会给身体安排适合自己的活动或运动。'],['body','连续用脑或看屏幕时，我会主动安排短暂休息。'],['body','为了赶事情，我经常忽略休息或正常吃饭。',true],
    ['meaning','除了必须完成的任务，我也有让自己好奇或投入的兴趣。'],['meaning','我能说出最近一件让自己感到有意义的小事。'],['meaning','我会留一点时间，做符合自己兴趣或在意之事的行动。'],['meaning','我常只按别人期待安排生活，很少问自己在意什么。',true],
    ['action','我会把计划拆成具体的小步骤，并开始行动。'],['action','我会主动维护重要关系，留出倾听与交流的时间。'],['action','答应别人的事情，我会完成，或及时说明变化。'],['action','我经常只停留在计划阶段，很少迈出第一步。',true]
  ];
  function questions(kind,age){
    if(!Object.hasOwn(kinds,kind)||!ages.some(a=>a.id===age))throw Error('请选择12岁及以上的有效年龄段。');
    if(kind==='thinking')return thinking(age);
    return (kind==='emotion'?emotionItems:balanceItems).map(([dimension,prompt,reverse],i)=>({id:kind[0]+(i+1),dimension,prompt,reverse:!!reverse,options:['几乎没有','较少如此','有时如此','经常如此','几乎总是']}));
  }
  function validAnswers(kind,age,answers,complete=false){
    if(!Object.hasOwn(kinds,kind)||!ages.some(a=>a.id===age)||!Array.isArray(answers))return false;
    const qs=questions(kind,age);
    return answers.length===qs.length&&answers.every((a,i)=>a===null?!complete:Number.isInteger(a)&&a>=0&&a<qs[i].options.length);
  }
  function evaluate(kind,age,answers){
    if(!validAnswers(kind,age,answers,true))throw Error('请完成所有题目后再查看结果。');
    const qs=questions(kind,age),correct=kind==='thinking'?qs.reduce((n,q,i)=>n+(answers[i]===q.answer?1:0),0):null;
    const dimensions=kinds[kind].dimensions.map(([id,label])=>{
      const rows=qs.map((q,i)=>({q,i})).filter(r=>r.q.dimension===id);
      const value=rows.reduce((n,{q,i})=>n+(kind==='thinking'?(answers[i]===q.answer?1:0):q.reverse?5-answers[i]:answers[i]+1),0);
      const max=rows.length*(kind==='thinking'?1:5),ratio=kind==='thinking'?value/max:(value/rows.length-1)/4;
      return {id,label,value,max,average:kind==='thinking'?null:Math.round(value/rows.length*10)/10,ratio,labelText:kind==='thinking'?(ratio<.5?'值得再练习':ratio<1?'继续巩固':'本次全部答对'):(ratio<.4?'值得多留意':ratio<.75?'正在积累':'本次自评较稳定'),advice:advice[id][ratio<.75?0:1]};
    });
    return {kind,age,correct,total:qs.length,dimensions};
  }
  function validateDraft(d){
    return !!d&&Object.hasOwn(kinds,d.kind)&&validAnswers(d.kind,d.age,d.answers)&&Number.isInteger(d.index)&&d.index>=0&&d.index<d.answers.length&&Number.isFinite(Date.parse(d.startedAt));
  }
  function validateStore(s){
    return !!s&&s.version===VERSION&&ages.some(a=>a.id===s.age)&&s.drafts&&typeof s.drafts==='object'&&!Array.isArray(s.drafts)&&Object.keys(s.drafts).length<=9&&Object.entries(s.drafts).every(([key,d])=>key===d?.kind+'@'+d?.age&&validateDraft(d))&&Array.isArray(s.history)&&s.history.length<=12&&s.history.every(r=>r&&typeof r.id==='string'&&r.id.length<=60&&Number.isFinite(Date.parse(r.at))&&validAnswers(r.kind,r.age,r.answers,true));
  }
  return {VERSION,KEY,ages,kinds,questions,validAnswers,evaluate,validateDraft,validateStore};
});
