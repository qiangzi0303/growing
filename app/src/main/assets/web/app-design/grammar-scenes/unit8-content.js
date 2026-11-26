/* Original error-focused practice aligned with the existing upper-book Unit 8 scope. */
(()=>{
 const lessons={};
 const add=(lesson,tab,p)=>{(lessons[lesson]||={tab,points:[]}).points.push(p);};
 add('reading','地震叙事',{
  id:'event-order',title:'按时间整理事件',rule:'用时间词和事件联系整理“开始—被困—等待—获救”的叙事线。',pitfall:'叙述中出现回顾时，应按实际发生顺序整理，不只按句子出现顺序。',
  sentence:'At first he felt the ground shake. Later he waited for help. Finally he was safe.',translation:'起初他感到地面摇晃。后来他等待援助。最后他安全了。',explain:'这是对事件顺序的简化概括；at first、later、finally 为三个阶段提供线索，不替代课文细节。',
  animation:{kind:'sequence',actors:['Timmy','救援者'],labels:['地震开始','被困，等待救援','最终获救']},rows:[
   ['At first / then / finally 主要帮助读者追踪？','事件顺序|人物身高|单词词性','这些表达提示叙事时间线。'],
   ['finally 在事件叙述中通常表示？','最后|从来不|与此同时的所有时刻','finally 标记最后阶段。'],
   ['本课 Timmy 的经历应先写哪项？','地震开始|最后获救|向别人回忆全部经过','地震开始是这条故事线的起点。'],
   ['“He waited for help.”表达了什么动作？','等待援助|举行比赛|购买礼物','wait for help 为等待帮助。'],
   ['“Then the rescuers arrived.”中的 then 说明？','下一阶段|一个人的名字|绝对没有先后关系','then 在叙事中连接后续事件。'],
   ['整理被困与获救两件事，应怎样排序？','先被困，再获救|先获救，再首次被困|两者只能同时发生','在本课幸存经历中，被困先于获救。'],
   ['材料：“He was safe at last. Two hours earlier, he was still trapped.”实际顺序是？','先被困，后安全|先安全，后被困|始终未被困','earlier 提示回顾，不能只按句序排列。'],
   ['概括叙事时，哪种做法更可靠？','保留关键事件与先后联系|只抄出现最多的形容词|把没有写出的救援时间随意补上','概括依据原文，不能编造细节。'],
   ['材料：“After the noise stopped, he heard a voice. Before that, he had waited quietly.”应怎样排？','安静等待→噪声停止→听到声音|听到声音→等待→噪声开始|噪声停止→获救五天→声音','after 与 before that 提供相对顺序，第三项还添加无依据时间。'],
   ['写一份故事梗概，哪项结构最合适？','地震开始→倒塌被困→镇静等待→得到救援|先下通用逃生结论，再省略全部事件|只列人物名字，不交代发生了什么','梗概需要事件与发展过程，且不能把个别经历写成普遍操作指令。']
  ]
 });
 add('reading','地震叙事',{
  id:'feelings-evidence',title:'用细节追踪情绪',rule:'从声音、动作和心理描写判断情绪变化，区分故事情节与通用建议。',pitfall:'“努力镇静”不等于“从未害怕”；人物的一次选择不自动适合所有险情。',
  sentence:'He felt nervous, but he tried to calm down and wait for help.',translation:'他很紧张，但努力镇静下来等待援助。',explain:'nervous 写出情绪，tried to calm down 写出应对；but 体现从紧张向冷静的努力。实际遇险应遵循当地专业指引。',
  animation:{kind:'sequence',actors:['Timmy','救援者'],labels:['nervous：紧张','calm down：镇静','wait for help：等待']},rows:[
   ['Try to calm ___.','down|up|off','calm down 表示平静下来。'],
   ['“He felt nervous.”说明他的什么？','情绪|身高|年龄','nervous 表示紧张。'],
   ['“He tried to calm down.”最准确的意思是？','他努力让自己镇静|他从来没有害怕|他立即忘记一切','try to 表示努力尝试，不说明此前没有害怕。'],
   ['哪项属于声音描写？','He heard a loud noise.|He was two metres tall.|His bag was blue.','heard a loud noise 通过听觉描写环境。'],
   ['“He shouted for help.”属于哪类细节？','求助动作|天气统计|人物出生日期','shouted 表示具体行动，for help 说明求助目的。'],
   ['课文人物的被困经历应首先当作？','特定故事情节|适用于所有灾害的统一指令|地震仪器说明书','阅读叙事不等于通用应急训练。'],
   ['“He was afraid, but he spoke calmly.”能支持哪个判断？','他害怕，但努力控制表达方式|他完全没有恐惧|只要镇静说话就说明不可能受困','内在情绪和外在行为可不同，but 提示转折。'],
   ['要证明人物从紧张趋向镇静，哪组证据最相关？','先写nervous，再写tried to calm down|只写他的衣服颜色|只写街道名字','情绪词与调节动作直接反映变化。'],
   ['材料说“听到声音后他觉得有希望”，哪项推断过度？','只要听到任何声音就一定马上获救|人物因声音产生希望|声音影响了人物心理','有希望不等于已经保证马上获救。'],
   ['讲述 Timmy 的故事时，哪种总结兼顾阅读理解与适用范围？','他经历恐惧并努力镇静求助；具体险情仍应遵循专业指引|照抄他每个动作就能保证任何地震中安全|他最终获救证明地震并不危险','把人物情绪与事件概括清楚，同时不把一次经历扩大为安全保证。']
  ]
 });
 add('past-continuous','过去进行时',{
  id:'was-were-doing',title:'过去正在做',rule:'过去某时正在进行：was / were + 动词-ing，be 与主语一致。',pitfall:'有昨天这个词不代表一律用过去进行时；关键是当时正在进行。',
  sentence:'At eight last night, I was reading and my parents were cooking.',translation:'昨晚八点，我正在读书，父母正在做饭。',explain:'把镜头停在昨晚八点：I 用 was，my parents 用 were；reading、cooking 展示该时刻正在进行的动作。',
  animation:{kind:'action',actors:['我','父母'],labels:['昨晚八点','I was reading','parents were cooking']},rows:[
   ['At eight last night, she ___ a book.','was reading|were reading|reads','过去时点正在读书，she 配 was reading。'],
   ['At this time yesterday, they ___ football.','were playing|was playing|play','they 配 were；当时正在踢球用进行时。'],
   ['I ___ doing homework at seven yesterday evening.','was|were|am','I 的过去进行时助动词为 was。'],
   ['We were ___ for the bus at that moment.','waiting|wait|waited','were 后接动词-ing 构成进行时。'],
   ['“He was sleeping at ten last night.”强调？','昨晚十点正在睡觉|他每天十点都睡|他将来十点睡觉','过去时点与 was sleeping 描述当时进行动作。'],
   ['“You were listening.”中的 were 与哪个主语匹配？','you|he|it','you 的过去式 be 为 were。'],
   ['At nine last night, Tom and I ___ a film.','were watching|was watching|are watching','Tom and I 相当于 we，过去进行时用 were watching。'],
   ['“The children were playing while the teacher was watching.”两处be为何不同？','children复数用were，teacher单数用was|前面的动作更重要所以用were|watching前永远用was','be 的形式取决于各自从句主语。'],
   ['“My father, together with my sisters, ___ cooking at six yesterday.”应选？','was|were|is','中心主语为单数 My father，together with 不把它改成复数主语。'],
   ['家庭回忆“昨晚八点我读书，弟弟画画，父母做饭”，哪组正确？','I was reading; my brother was drawing; my parents were cooking.|I were reading; my brother were drawing; my parents was cooking.|I was read; my brother was draw; my parents were cook.','三处都需过去be + -ing，并按主语单复数选择was/were。']
  ]
 });
 add('past-continuous','过去进行时',{
  id:'negative-question',title:'否定与疑问',rule:'否定在 was / were 后加 not；疑问把 was / were 提到主语前。',pitfall:'已有 was / were 的过去进行时，不再用 did 来构造同一句的否定或疑问。',
  sentence:'They were not sleeping. Were they waiting for help?',translation:'他们当时没有睡觉。他们在等待援助吗？',explain:'保留 -ing 形式，只调整 be 和 not 的位置。简短回答为 Yes, they were. / No, they were not.。',
  animation:{kind:'transform',actors:['询问者','等待者'],labels:['They were waiting','They were not waiting','Were they waiting?']},rows:[
   ['“He was sleeping.”的一般疑问句是？','Was he sleeping?|Did he sleeping?|Was sleeping he?','was 提到主语 he 前，sleeping 保持。'],
   ['“They were waiting.”的否定句是？','They were not waiting.|They did not waiting.|They were no waiting.','not 放在 were 后。'],
   ['Were you reading at that time? — Yes, I ___.','was|did|am','回答与过去进行时一致，主语 I 用 was。'],
   ['Was she cooking then? — No, she ___.','was not|did not|were not','she 的否定简答用 was not。'],
   ['___ the children playing when you arrived?','Were|Was|Did','children 为复数，过去进行时疑问用 Were。'],
   ['He ___ watching TV at nine; he was studying.','was not|did not|not was','过去进行时否定为 was not watching。'],
   ['“What were they doing?”的语序为什么正确？','疑问词 + were + 主语 + doing|疑问词后必须先放doing|任何疑问句都必须加did','特殊疑问句保留助动词提前的语序。'],
   ['改错：“Did you were drawing at eight?”哪项正确？','Were you drawing at eight?|Did were you drawing at eight?|Were drawing you at eight?','这里直接用 were 构成疑问，不叠加 did。'],
   ['“Who was waiting outside?”为何who后没有另一个主语？','who本身就是主语|此句完全没有主语|waiting是主语','主语疑问词 who 直接与 was waiting 构成句子。'],
   ['调查昨夜活动，哪组问答都正确？','Were they cooking? No, they were not. They were reading.|Did they cooking? No, they did not. They were read.|Was they cooking? No, they was not. They reading.','疑问、否定与补充陈述都保持主语一致和 be + -ing 结构。']
  ]
 });
 add('past-continuous','过去进行时',{
  id:'ongoing-or-finished',title:'正在进行与整体完成',rule:'过去进行时看某时刻正在做；一般过去时可陈述完成的事件。',pitfall:'know 等状态动词通常不用进行时；看到过去时间词仍要先理解句意。',
  sentence:'At eight I was reading. I finished the book at nine.',translation:'八点时我正在读书。九点时我读完了这本书。',explain:'was reading 是过程中的截面，finished 是完成事件；两种时态可在同一段叙事中各司其职。',
  animation:{kind:'sequence',actors:['读者'],labels:['八点：正在读','九点：读完','过程 ≠ 完成']},rows:[
   ['“I was reading at eight.”是否直接说明八点已读完？','没有，只说明当时在读|说明已经读完全部|说明从未开始读','进行时突出过程，不保证完成。'],
   ['“I finished the book yesterday.”主要陈述？','昨天完成读书这件事|昨天某时一定正在读且未结束|未来打算读书','finished 以一般过去时陈述完成事件。'],
   ['I ___ the answer then.（那时知道答案）','knew|was knowing|were knowing','know 表状态，通常用一般过去时 knew。'],
   ['At that moment, she ___ a letter.（正在写）','was writing|writes|will write','明确过去当时正在写，用 was writing。'],
   ['“He opened the door and entered.”更着重什么？','先后发生的两个事件|两个持续整晚的背景动作|将来的计划','一般过去时 opened、entered 表先后事件。'],
   ['哪项不能单独保证应选过去进行时？','句中出现yesterday|明确说过去某刻正在做|给出过去某时的动作进行画面','yesterday 只确定过去，具体体貌仍看语境。'],
   ['“At six I was cooking. At seven dinner was ready.”哪项正确？','六点在做饭，七点饭已准备好|六点已经吃完饭|七点必定还没开始做饭','区分过程与后续结果。'],
   ['“I visited the museum yesterday.”与“I was visiting it at noon.”差别在于？','前句说参观事件，后句把镜头停在中午过程|前句将来，后句现在|两句都表示从未去过','简单过去描述事件，过去进行描述特定时刻的进行。'],
   ['材料：“At eight he was writing a report, but he did not finish it that night.”能推出？','八点在写，但当晚未完成|过去进行时证明当晚已经写完|他当晚完全没动笔','进行动作与未完成结果可以同时成立。'],
   ['写“我当时知道地址，正往那里走，随后到达了”，哪组时态合理？','knew; was walking; arrived|was knowing; walked every day; will arrive|know; am walking; arrives','知道为过去状态，用 knew；行走为背景过程；到达为后续事件。']
  ]
 });
 add('when-while','when / while / as',{
  id:'background-interruption',title:'长动作与突然发生',rule:'用过去进行时呈现长动作背景，用一般过去时写突然发生的短事件。',pitfall:'不要写 was begin 或 was rang；过去进行时必须是 be + 动词-ing。',
  sentence:'I was reading when the phone rang.',translation:'电话响时，我正在读书。',explain:'读书是已经进行中的背景，电话响是插入的短事件。when 连接两者，时态由动作关系决定。',
  animation:{kind:'action',actors:['读书者','电话'],labels:['was reading：背景','phone rang：短事件','when：连接']},rows:[
   ['I was walking home when it suddenly ___ to rain.','began|was begin|beginning','突然开始是短事件，began 为一般过去时。'],
   ['She ___ dinner when the doorbell rang.（当时正做饭）','was cooking|cooks|will cook','做饭为过去正在进行的背景。'],
   ['“I was sleeping when the phone rang.”中短事件是？','the phone rang|I was sleeping|两项都从未发生','电话响是插入的短事件。'],
   ['“We were waiting when the bus arrived.”中背景动作是？','were waiting|arrived|the bus','等待为持续背景，到达为短事件。'],
   ['He was reading when he ___ a noise.','heard|was hear|hearing','听到声音作为事件，用 heard。'],
   ['哪句结构正确？','I was drawing when Dad came in.|I was draw when Dad came in.|I drawing when Dad was come in.','背景 be + -ing；came in 为过去事件。'],
   ['“When the teacher entered, we were discussing the question.”是否与长短动作规则一致？','一致，从句可先出现，动作关系不变|不一致，when必须放句中|不一致，主句必须只用一般现在时','when 从句前置不改变 entered 与 were discussing 的关系。'],
   ['“They were playing when the rain started.”能确定什么？','开始下雨时他们正在玩|他们玩耍一定导致下雨|雨一直没开始','when 说明时间交点，不表示因果。'],
   ['“I was reading when the light went out, so I stopped.”事件关系应如何理解？','先处于读书过程→灯灭→停止读书|先停止→灯亮→开始读书|读书一定把灯烧坏','进行背景、插入事件和后续动作各有时态和逻辑功能。'],
   ['记录“当时我们在等车，忽然听到一声响，然后老师来了”，哪句准确？','We were waiting for the bus when we heard a noise. Then the teacher arrived.|We wait when we were hear a noise. Then the teacher arriving.|We were waited when a noise was rang. Then arrive the teacher.','waiting 为背景，heard 和 arrived 为发生的事件，不能滥加 was。']
  ]
 });
 add('when-while','when / while / as',{
  id:'simultaneous-actions',title:'同时进行与语境',rule:'while 常接延续动作；两个长动作同时进行可都用过去进行时。',pitfall:'when 不只接短动作；as 也可表示随着，不能机械按连词决定时态。',
  sentence:'While I was doing homework, my sister was drawing. As time passed, it grew darker.',translation:'我做作业时，妹妹在画画。随着时间推移，天变得更暗。',explain:'第一句两个长动作同时进行；第二句 as 表示随着变化，passed、grew 不需要强行改成进行时。',
  animation:{kind:'action',actors:['我','妹妹'],labels:['我做作业','妹妹画画','while：同时进行']},rows:[
   ['While Mum was cooking, Dad ___ the dishes.（当时也正在洗）','was washing|washes every day|will wash','两个过去同时进行的长动作都可用过去进行时。'],
   ['哪句的 while 用法符合本课时间从句规则？','While I was waiting, a bus arrived.|While he arrived once, I was waiting.|While the door suddenly shut once, we talked.','while 从句用延续动作 was waiting。'],
   ['“I was reading while she was drawing.”表达？','两项动作当时同时进行|读完后才开始画|画画导致阅读','while 连接同时进行的过程，不直接表示因果。'],
   ['“As time passed, it grew darker.”中的 as 表示？','随着|除非|尽管','这里伴随时间推移，天色逐渐变化。'],
   ['“When I was walking home, I saw Amy.”中的 when 是否只能接短动作？','不是，这里接延续的walking|是，所以句子一定错误|when只能接名词','when 可引导包含延续动作的从句。'],
   ['“She sang as she walked.”可理解为？','她一边走一边唱|她走路之前从未唱歌|她唱歌所以不能走路','as 在这里连接伴随发生的动作。'],
   ['把“我正在读书，妹妹也正在画画”放进昨晚八点背景，哪句最恰当？','I was reading while my sister was drawing.|I read tomorrow while my sister draws now.|I was reading while my sister was draw.','两项过去同时进行的动作，各用 was + -ing。'],
   ['“While he was resting, the phone rang.”主从句为何时态不同？','休息为延续背景，电话响为短事件|while要求全句所有动词形式相同|rang在这里是进行时','while 约束从句语义，不要求主句也为持续动作。'],
   ['有人说“看见as就全部填was doing”，哪句足以说明这种方法不可靠？','As time passed, it grew colder.|As I was reading, he was drawing.|As she was walking, she was talking.','表示随着的句子可用一般过去时；不能只看连接词。'],
   ['叙事“随着天变暗，我们仍在等；等候时一辆车来了”，哪句准确？','As it grew dark, we were still waiting. While we were waiting, a car arrived.|As it was grew dark, we still wait. While a car arrived once, it waiting.|While dark arrived once, a car was arrive and we waiting.','第一句 as 写变化，第二句 while 给等待背景，arrived 写到达事件。']
  ]
 });
 add('writing','构词与安全叙事',{
  id:'compound-words',title:'复合词看组合与拼写',rule:'两个词可以构成复合词，但词序、连写方式和词义仍须核对。',pitfall:'snowstorm 是已确认词形，不能随意倒成 stormsnow。',
  sentence:'A snowstorm delayed the flight at the airport.',translation:'一场暴风雪使机场的航班延误了。',explain:'snow + storm → snowstorm；air + port → airport。理解组成有助记忆，不代表任意两个词都能连成新单词。',
  animation:{kind:'transform',actors:['学习者'],labels:['snow + storm','snowstorm','air + port → airport']},rows:[
   ['snow + storm 构成的正确单词是？','snowstorm|stormsnow|snowstorming','snowstorm 表示暴风雪，词序固定。'],
   ['air + port 构成的单词是？','airport|portair|airlyport','airport 表示机场。'],
   ['snowstorm 的含义是？','暴风雪|晴天|机场','snowstorm 结合雪与风暴的词义。'],
   ['airport 的含义是？','机场|空中的门|暴风雨','复合词有固定整体词义，不必逐字硬译。'],
   ['学习复合词时，哪种做法可靠？','核对词表中的拼写和词义|把任意两个词倒序连写|所有复合词都加-ing','构词规律只是辅助，还须确认词形和含义。'],
   ['“The airport is closed.”中 airport 的词性是？','名词|副词|连词','airport 为地点名词，在这里作主语。'],
   ['“A snowstorm hit the area.”中为何不是 snowstorming？','这里需要名词表示一场暴风雪|storming是所有天气名词的固定后缀|a后面只能放形容词','a 后的名词短语作主语，用 snowstorm。'],
   ['“The flight left the airport after the snowstorm.”两词分别指？','机场；暴风雪|暴风雪；机场|空气；雪人','先理解每个复合词的整体意思，再理解句子事件。'],
   ['有人把snowstorm按字面拆成“雪店”，问题在哪里？','storm是风暴，不是store；构词要核对原词|任何带snow的词都表示商店|port必定表示风暴','相似拼写不能混淆，storm 与 store 不同。'],
   ['写“暴风雪过后我们到达机场”，哪句拼写与意义一致？','We reached the airport after the snowstorm.|We reached the portair after the stormsnow.|We reached the airstorm after the snowport.','两个已核对复合词都用固定词序及拼写。']
  ]
 });
 add('writing','构词与安全叙事',{
  id:'avoid-warn',title:'avoid 与 warn',rule:'avoid 后接 doing；warn sb not to do 表示警告某人不要做。',pitfall:'不要写 avoid to do，也不要在 warn sb 后直接接 don’t do。',
  sentence:'The teacher warned us not to play on the road. We should avoid running in heavy traffic.',translation:'老师警告我们不要在马路上玩耍。我们应避免在车流中奔跑。',explain:'avoid + running；warn + us + not to play。两种结构表达不同关系，不能混用动词形式。put out 表示扑灭。',
  animation:{kind:'choice',actors:['老师','学生'],labels:['avoid running','warn us not to play','注意动词搭配']},rows:[
   ['We should avoid ___ on the busy road.','playing|to play|play','avoid 后用动名词 playing。'],
   ['The sign warns us ___ here.（不要游泳）','not to swim|do not swim|not swimming','warn sb not to do。'],
   ['She tried to avoid ___ the same mistake.','making|to make|made','avoid doing sth，make 变 making。'],
   ['The teacher warned ___ not to run.','us|we|our','warn 后人作宾语，用 us。'],
   ['“put out a fire”表示？','扑灭火|点燃火|制造风暴','put out 表示熄灭、扑灭。'],
   ['“warn sb not to do”中的 not 应放在？','to之前|sb之前任意位置|动词原形之后','本结构否定不定式为 not to do。'],
   ['We should avoid ___ and listen when adults warn us ___.','running; not to push|to run; do not push|run; not pushing','avoid doing 与 warn sb not to do 各自遵守搭配。'],
   ['改错：“He warned me don’t go near it.”应改为？','He warned me not to go near it.|He warned I not to go near it.|He warned me not going near it.','宾语用 me，后接 not to go。'],
   ['“He warned us not to touch it.”是否说明我们已经触碰？','不能确定，只说明他发出警告|一定已经触碰|一定永远无法触碰','警告的内容不等于动作已经发生。'],
   ['报道“老师提醒我们别推挤，大家避免奔跑”，哪句正确？','The teacher warned us not to push, and we avoided running.|The teacher warned us do not push, and we avoided to run.|The teacher warned we not pushing, and we avoided run.','warn 的宾语及不定式、avoid 后的动名词都准确。']
  ]
 });
 add('writing','构词与安全叙事',{
  id:'narrative-plan',title:'背景—经过—援助—结果',rule:'先交代时间地点与背景，再按顺序写事件、援助和结果。',pitfall:'只写“很可怕”不够；用有依据的动作与心理细节，不编造普遍逃生保证。',
  sentence:'We were waiting at the stop when the storm began. Later a teacher helped us get indoors.',translation:'暴风雨开始时，我们正在车站等车。后来一位老师帮助我们到了室内。',explain:'这是原创叙事情境：过去进行时交代背景，began 和 helped 写先后事件，地点 stop 与 indoors 使经过清楚。',
  animation:{kind:'sequence',actors:['学生','老师'],labels:['车站等候：背景','风暴开始：事件','得到援助：结果']},rows:[
   ['事故叙事开头最应交代？','时间、地点和人物处境|只列十个形容词|只写结尾祝福','读者需先知道事件在何时何地发生。'],
   ['“We were waiting at the stop.”在叙事中可作？','进行中的背景|明确的全部最终结果|未来计划','were waiting 描绘过去进行中的场景。'],
   ['“Then a teacher arrived.”中的 then 有何作用？','连接后续事件|表示地点|表示人物国籍','then 帮助追踪事件进展。'],
   ['“We thanked the helpers.”适合呈现？','接受援助后的反应|暴风雨的精确成因|人物出生时间','感谢是得到帮助后的反应。'],
   ['哪句提供了具体行动细节？','She called for help.|It was very very very bad.|Something was something.','called for help 明确说明做了什么。'],
   ['写亲历叙事时，哪些细节应避免？','没有依据却冒充亲眼所见的情况|真实时间与地点|实际的心理感受','叙事应区分事实与想象，不编造证据。'],
   ['“I was walking home. Suddenly it began to rain. I went into a shop.”最清楚的结构是？','背景→突发事件→后续动作|结果→生日→天气规律|三项全是同时完成的动作','进行时作背景，两个一般过去时推进事件。'],
   ['一段只有“暴风雨很大，我很害怕”，最需要补什么？','事件经过、如何得到援助和结果|更多与事件无关的名人名字|重复“很害怕”十次','情绪应与事件经过、援助及结局结合。'],
   ['“我们顺利到达室内，所以这套做法保证所有风暴中安全”有什么问题？','由一次结果推出所有情形的保证，超出证据|使用所以就一定语法错误|叙事不能写任何结果','可以如实写结果，但不能扩大为适用于所有环境的保证。'],
   ['哪段符合本课安全主题叙事结构？','Yesterday we were waiting at the stop when a storm began. A teacher helped us get indoors. We felt relieved and thanked her.|Storms are always harmless. Everybody is safe whatever they do.|I was waiting. My favourite colour is red. The moon is far away.','第一段有时间地点、背景、事件、援助与结果；其余绝对化或偏离主题。']
  ]
 });
 window.GrowingEnglishPointCourses.define('english-8a-08',{lessons});
})();
