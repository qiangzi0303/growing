/* Original teaching examples and error-focused exercises; not exam quotations. */
(()=>{
 const lessons={reading:{tab:'校园生活',points:[]},amount:{tab:'数量比较',points:[]},equality:{tab:'同级比较',points:[]},writing:{tab:'学校改进',points:[]}};
 const add=(lesson,p)=>lessons[lesson].points.push(p);
 add('reading',{id:'school-facts',title:'用事实比较学校',rule:'按学校规模、课程、活动、感受分别整理；事实和个人评价分开。',pitfall:'学校小不等于课程差；“我喜欢”不证明所有人都喜欢。',sentence:'School A has fewer students, but it offers many activities.',translation:'A校的学生更少，但它提供许多活动。',explain:'先找能直接比较的数据或明确事实，再说相同点和不同点，不凭喜好推出没有依据的结论。',animation:{kind:'sequence',actors:['A校','B校'],labels:['学生人数','课程与活动','事实再比较']},rows:[
 ['比较校园生活时，哪项是可核对的事实？','School A has 600 students.|My school is perfect.|Everyone must love my school.','人数是可核对的信息；完美与所有人都喜欢是主观或未经证实的判断。'],
 ['“I enjoy our art lessons.”主要表达什么？','学生感受|学校人数|教室面积','enjoy表示个人喜欢，不是学校规模数据。'],
 ['读到“School B has a drama club”，应记在哪一栏？','课程与活动|学校建筑高度|学生身高','戏剧社属于学校活动。'],
 ['甲校600人，乙校900人。可以直接得出？','甲校学生比乙校少|甲校所有课程更难|乙校每个人都更快乐','只有人数比较得到给定数据支持。'],
 ['阅读学校博客时，哪种笔记更利于比较？','按人数、课程、活动分栏|只抄所有形容词|按单词字母顺序抄全文','用同样的项目整理两所学校，才能对应比较。'],
 ['“The school offers French and drama.”说明什么？','学校开设法语和戏剧课程|所有学生来自法国|学校只开两门课','列出两门课程不能推出国籍或全部课程数。'],
 ['A校有500人和10个社团，B校有800人和8个社团。哪句符合数据？','A has fewer students but more clubs.|A has more students and fewer clubs.|B has fewer students and more clubs.','分别比较两个指标，A人数少但社团多。'],
 ['“我喜欢小学校，所以小学校教学一定更好”有什么问题？','把个人喜好当成教学质量的证据|没有使用最高级|没有把school改成schools','喜好不能直接证明客观教学质量。'],
 ['两校学生数不同，但每班人数未给出。能确定哪项？','不能仅用全校人数判断平均班级大小|总人数少的学校每班一定更少|总人数多的学校每班一定更少','还需班级数或每班人数，不能用总量代替平均量。'],
 ['材料：A校更小，有戏剧课；B校更大，有科学社。哪段总结有依据？','The schools differ in size and activities; both offer learning opportunities.|A is smaller, so it has no interesting lessons.|B is larger, so every student prefers it.','同时整理规模和活动事实，不从规模推断兴趣或偏好。']
 ]});
 add('reading',{id:'school-phrases',title:'介词 to 与提供',rule:'look forward to / pay attention to 后可接 doing；offer sb sth = offer sth to sb。',pitfall:'这里的 to 是介词，不是所有 to 后都用动词原形。',sentence:'I look forward to joining the club. It offers us new activities.',translation:'我期待加入社团。它为我们提供新的活动。',explain:'认出整组搭配再决定词形；把offer sb sth改写为offer sth to sb时，用to引出接受者。',animation:{kind:'transform',actors:['学生','社团'],labels:['look forward to','joining','offer us activities']},rows:[
 ['I look forward to ___ the drama club.','joining|join|joined','look forward to中的to是介词，后接joining。'],
 ['Pay attention to ___ the words clearly.','pronouncing|pronounce|pronounced','pay attention to后接动名词，表示注意发音。'],
 ['把“Our school offers students many activities.”改写为offer sth to sb结构，哪句正确？','Our school offers many activities to students.|Our school offers to students many activities to.|Our school offers students to many activities.','目标结构先放提供的活动，再用to students引出接受者；原句是offer sb sth。'],
 ['The teacher offers ___ useful advice.','us|we|our','offer sb sth中人作宾语，用us。'],
 ['We look forward to the trip. 这里to后面是？','名词短语|动词原形|比较级','the trip是名词短语，介词to可以接名词。'],
 ['She pays attention to ___ carefully.','listening|listen|listens','介词to后可接动名词listening。'],
 ['The school offers students free books. 同义转换是？','The school offers free books to students.|The school offers free books with students.|The school offers students to free books.','offer sb sth可以转换为offer sth to sb。'],
 ['哪句同时使用了正确的to搭配？','We hope to learn and look forward to learning.|We hope learning and look forward to learn.|We hope to learning and look forward to learned.','hope to do中的to是不定式标记，look forward to中的to是介词。'],
 ['改错：She looks forward to join the club that offers her many activities. 只需改哪处？','join → joining|offers → offer|her → she','主句look forward to后用joining；从句主语club为单数，offers与her均正确。'],
 ['学校提供活动，学生期待参加并认真听。哪句各搭配都正确？','The school offers activities to us. We look forward to joining and pay attention to listening.|The school offers activities for us. We look forward to join.|The school offers us activities. We pay attention to listen and look forward joining.','offer sth to sb、look forward to doing、pay attention to doing三处分别正确。']
 ]});
 add('amount',{id:'more-less-fewer',title:'先判断能不能数',rule:'可数名词复数用 fewer；不可数名词用 less；两者的“更多”都可以用 more。',pitfall:'homework、time、water 在这些句子中不可数，不能因作业很多就用 fewer。',sentence:'We have fewer tests and less homework this week.',translation:'这周我们的测验次数更少，作业量也更少。',explain:'先看名词，再看多或少。tests是一次一次可数的测验；homework说作业总量。',animation:{kind:'transform',actors:['测验','作业量'],labels:['可数 tests','fewer tests','less homework']},rows:[
 ['I have ___ pencils than you.（更少）','fewer|less|least','pencils是可数名词复数，用fewer。'],
 ['We need ___ water than before.（更少）','less|fewer|fewest','water不可数，用less。'],
 ['She has ___ homework today.（更少）','less|fewer|few','homework通常不可数。'],
 ['Our class has ___ students than theirs.（更多）','more|much|most','两者比较数量用more，可接可数复数。'],
 ['He spends ___ time on games than I do.（更多）','more|many|most','time不可数，表示更多用more。'],
 ['There are ___ buses on this road today.（更少）','fewer|less|little','buses可数复数，用fewer。'],
 ['We want ___ cars and ___ pollution.（更少）','fewer; less|less; fewer|fewer; fewer','cars可数用fewer；pollution不可数用less。'],
 ['甲读5本书，乙读3本；甲用时2小时，乙用时4小时。哪句正确？','A reads more books in less time.|A reads fewer books in more time.|A reads more books in fewer time.','书的数量5大于3，用more；time不可数且用时少，用less。'],
 ['“fewer bottles of water”和“less water”有何区别？','前者比较瓶数，后者比较水量|两者都只能比较瓶的颜色|water前只要出现bottles就永远不能用fewer','名词短语中心不同：bottles可数，water不可数。'],
 ['改进学习计划：测验由5次减为3次，作业由2小时减为1小时。哪句准确？','We have fewer tests and less homework time.|We have less tests and fewer homework time.|We have fewest tests and least time than before.','两项都是前后比较，tests用fewer，time用less，不用最高级。']
 ]});
 add('amount',{id:'most-least',title:'三个以上选最多最少',rule:'the fewest + 可数名词复数；the least + 不可数名词；最多都可用 the most。',pitfall:'三者选最少先看范围，再选 fewest 或 least；不能只看“最少”两个汉字。',sentence:'Of the three, Amy has the fewest books and spends the least money.',translation:'三人中，埃米书最少，花的钱也最少。',explain:'few → fewer → fewest；little → less → least；many / much → more → most。',animation:{kind:'sequence',actors:['三名学生'],labels:['比较三人','fewest books','least money']},rows:[
 ['Of the three, Ben has ___ coins.（最少）','the fewest|the least|less','coins可数复数，三者最少用the fewest。'],
 ['Of all the students, Mia drinks ___ water.（最少）','the least|the fewest|fewer','water不可数，最高级用the least。'],
 ['Which class has ___ students in the school?（最多）','the most|more|much','全校范围内最多用the most students。'],
 ['Of these clubs, this one needs ___ money.（最多）','the most|many|more','money不可数，但最多仍用the most。'],
 ['little 表示数量少时的比较级和最高级是？','less; least|fewer; fewest|more; most','不可数量little的变化为less和least。'],
 ['few 的比较级和最高级是？','fewer; fewest|less; least|many; most','可数数量few的变化为fewer和fewest。'],
 ['三人分别用10、15、20分钟，10分钟的同学用了什么？','the least time|the fewest time|less time of all','time不可数，三者最少用the least time。'],
 ['A有2支笔，B有4支，C有6支；选出正确描述。','A has the fewest pens and C has the most.|A has the least pens and C has more of all.|B has the fewest pens and A has the most.','笔可数，A最少用fewest，C最多用most。'],
 ['哪句同时正确处理比较范围和名词？','Of the four teams, ours made the fewest mistakes.|Of the four teams, ours made less mistakes.|Of the four teams, ours made the least mistakes.','mistakes可数复数；四队选最少用the fewest，不能用less或least。'],
 ['三组报告：A用纸8张/用时20分钟，B用纸6张/用时30分钟，C用纸10张/用时15分钟。哪项正确？','B used the fewest sheets, while C spent the least time.|B used the least sheets, while C spent the fewest time.|A used the fewest sheets and spent the least time.','B纸张数最少，用fewest；C时间最少，用least。']
 ]});
 add('equality',{id:'as-original',title:'as 中间用原级',rule:'as + 形容词 / 副词原级 + as；not as / so ... as 表示不如。',pitfall:'as tall as不用taller；A不如B高，矮的是A。',sentence:'Our library is as quiet as yours, but our hall is not as large.',translation:'我们的图书馆和你们的一样安静，但我们的大厅没有那么大。',explain:'同级比较先找两边的as；否定比较再确认主语和比较对象，避免把方向说反。',animation:{kind:'transform',actors:['A','B'],labels:['as tall as','同级用原级','not as tall']},rows:[
 ['This room is as ___ as that one.（安静）','quiet|quieter|quietest','as...as中间用形容词原级。'],
 ['Amy runs as ___ as Ben.（快）','fast|faster|fastest','这里fast作副词，仍用原级。'],
 ['This bag is not as heavy as that one. 哪个包更轻？','this bag|that bag|无法判断，因为not没有意义','not as heavy as表示这个包没有那个重，即更轻。'],
 ['The new book is as ___ as the old one.（有趣）','interesting|more interesting|most interesting','长形容词在同级比较中也用原级。'],
 ['He is not so tall ___ his brother.','as|than|to','not so...as是同级比较的否定结构。'],
 ['A is not as old as B. 同义句是？','A is younger than B.|A is older than B.|A is the oldest.','A没有B年长，即A更年轻。'],
 ['哪句修正了“The test is as easier as that one”？','The test is as easy as that one.|The test is as easiest as that one.|The test is as more easy as that one.','as之间只能用原级easy。'],
 ['Lily高160厘米，Lucy也高160厘米。哪句正确？','Lily is as tall as Lucy.|Lily is not as tall as Lucy.|Lily is taller than Lucy.','身高相同用as tall as，不能说不如或更高。'],
 ['A跑得没有B快，B和C一样快。可以推出？','A runs more slowly than C.|A runs as fast as C.|A runs faster than C.','B与C速度相同，A慢于B，也慢于C。'],
 ['教室甲与乙同样大，但甲没有乙安静。哪句准确？','Room A is as large as B, but it is not as quiet as B.|Room A is as larger as B and quieter than B.|Room A is not as large as B, but as quieter as B.','面积相同用as large as；安静程度低用not as quiet as，均用原级。']
 ]});
 add('equality',{id:'many-much',title:'一样多：many / much',rule:'as many + 可数名词复数 + as；as much + 不可数名词 + as。',pitfall:'as many books；as much time；as more...as 不成立。',sentence:'I have as many books as you, but not as much free time.',translation:'我的书和你一样多，但空闲时间没有你多。',explain:'many与much由后面的名词决定；not表示数量不及比较对象。',animation:{kind:'quantity',actors:['我的书','你的书'],labels:['可数 books','as many as','数量相同'],items:['我的书','你的书'],values:[3,3]},rows:[
 ['I have as ___ notebooks as you.','many|much|more','notebooks可数复数，用many。'],
 ['She has as ___ free time as I do.','much|many|more','free time不可数，用much。'],
 ['We need as much ___ as they do.','water|bottles|books','much后接不可数名词water。'],
 ['He has as many ___ as his sister.','stickers|money|homework','stickers是可数名词复数。'],
 ['I do not have as ___ money as you.','much|many|most','money不可数，同级比较用much。'],
 ['They made as ___ cards as we did.','many|much|more','cards可数复数，用many，不用比较级more。'],
 ['“相同数量的瓶子”和“相同数量的牛奶”分别是？','as many bottles; as much milk|as much bottles; as many milk|as more bottles; as more milk','分别根据可数瓶数与不可数奶量选many和much。'],
 ['A与B各有5本书，但A只有B一半的时间。哪句对？','A has as many books as B but not as much time.|A has as much books as B and as many time.|A has fewer books than B but more time.','书数相等，用as many；时间更少，用not as much。'],
 ['“We have as many classes as they do.” 能直接证明什么？','课程或课次的数量相同|每门课内容完全相同|所有课堂时长必然相同','as many只比较数量，不保证内容和时长相同。'],
 ['两组各用6张纸、同样多胶水；哪句完整正确？','We used as many sheets of paper and as much glue as they did.|We used as much sheets and as many glue as they did.|We used as more paper and as more glue as they did.','sheets可数用many，glue不可数用much；同级比较不用more。']
 ]});
 add('writing',{id:'nationality-advice',title:'语言名称与建议',rule:'语言 / 国籍首字母大写；suggest doing；a suggestion，但 some advice。',pitfall:'advice通常不可数，不能写an advice；suggest后不能直接接to do。',sentence:'I suggest reading Japanese stories. Here is some advice.',translation:'我建议读日语故事。这里有一些建议。',explain:'写建议时先检查动词搭配，再检查名词可数性；Italian、British、Japanese、American等要保留大写。',animation:{kind:'transform',actors:['学生','建议'],labels:['Japanese','suggest reading','some advice']},rows:[
 ['表示“日语”的正确拼写是？','Japanese|japanese|Japaneses','语言名称Japanese首字母大写，表示日语不加-s。'],
 ['I suggest ___ a reading club.','starting|to start|start','suggest后可接动名词starting。'],
 ['She gave me ___ useful advice.','some|an|many','advice不可数，用some，不用an或many。'],
 ['He made a useful ___.','suggestion|advice|suggest','a后需要可数名词单数suggestion。'],
 ['表示“意大利的；意大利人”的词应选？','Italian|italian|Italyan','Italian是正确词形，首字母大写。'],
 ['Which word is correctly capitalized?','British|british|bRitish','国籍形容词首字母大写。'],
 ['哪组都正确？','two suggestions; some advice|two advices; a suggestion|an advice; many suggestion','suggestion可数；advice不可数，需要区分。'],
 ['改错：I suggest to read american stories. 应改为？','I suggest reading American stories.|I suggest read American stories.|I suggest reading american stories.','suggest后用reading，同时American首字母大写。'],
 ['“一条建议”既想保留advice又表达一条，应写？','a piece of advice|an advice|one advices','不可数名词可用量词短语a piece of来计量。'],
 ['提出外语学习建议，哪句语法与书写都正确？','I suggest listening to Japanese stories. That is a useful suggestion.|I suggest to listen to japanese stories. That is an advice.|I suggest listening Japanese stories. Those are many advice.','suggest doing、listen to、大写Japanese和可数suggestion都正确。']
 ]});
 add('writing',{id:'improvement',title:'建议要回应问题',rule:'现状事实 → 具体建议 → 预期好处；provide sb with sth = provide sth for sb。',pitfall:'建议要具体可做，不能只写“学校应该更好”；provide与offer的介词不同。',sentence:'The library provides books for students. I suggest adding a quiet reading area.',translation:'图书馆为学生提供书籍。我建议增设一个安静阅读区。',explain:'先说明阅读空间的问题，再提出与问题对应的措施；用can或may描述合理预期，不保证一项措施解决所有问题。',animation:{kind:'sequence',actors:['图书馆','学生'],labels:['阅读区太吵','增加安静区','便于专心阅读']},rows:[
 ['The school provides students ___ books.','with|to|for','provide sb with sth，人后用with连接物品。'],
 ['用provide sth for sb表达：The library provides books ___ students.','for|of|at','按题目指定结构provide sth for sb，物品后用for引出受益者。'],
 ['“阅读区太吵”最直接对应哪项建议？','Set up a quiet reading area.|Paint every desk red.|Add more football matches.','安静阅读区直接回应噪声问题。'],
 ['哪句是具体建议？','Open the library for an extra hour.|Make everything wonderful.|Be better in every way.','延长一小时有明确行动，后两句空泛。'],
 ['改进建议短文的合适顺序是？','现状 → 建议 → 好处|无关故事 → 姓名 → 日期|反复说“很好”','先明确问题，再提出方案，最后说明预期效果。'],
 ['“It can help us read more.”在建议段里通常说明什么？','预期好处|学生姓名|建筑位置','can help引出建议可能带来的益处。'],
 ['The school provides us with lunch. 哪句同义？','The school provides lunch for us.|The school provides lunch to us.|The school provides with lunch us.','provide sb with sth可转为provide sth for sb。'],
 ['按offer sth to sb与provide sth for sb两个目标句型改写，哪组对应正确？','offer books to us; provide books for us|offer books for us; provide books to us|offer books with us; provide books to us','这里考查题目指定的两个句型：offer用to引出接受者，provide用for引出受益者。'],
 ['学生说“建一个花园，所有同学所有成绩一定提高”。怎样表达更有依据？','A garden may give students more chances to learn about plants.|A garden will certainly solve every school problem.|A garden proves that all students dislike science.','方案与合理学习机会有关，但不能保证全部成绩和所有问题。'],
 ['现状：午间想读书但无座位。哪段建议最完整？','There are too few seats at lunchtime. I suggest adding chairs. This can give more students a place to read.|The school is nice. I like it. Books are good.|We should offer chairs with students. This solves every problem.','明确现状、可实施措施与对应好处，同时避免错误搭配和绝对化结论。']
 ]});
 window.GrowingEnglishPointCourses.define('english-8a-02',{lessons});
})();
