/* Original teaching examples and error-focused exercises; not exam quotations. */
(()=>{
 const lessons={reading:{tab:'朋友与证据',points:[]},forms:{tab:'比较级构成',points:[]},comparison:{tab:'比较句型',points:[]},suffixes:{tab:'人物描写',points:[]}};
 const add=(lesson,p)=>lessons[lesson].points.push(p);
 add('reading',{id:'evidence',title:'品质要有证据',rule:'先说朋友的品质，再用具体行为作证据。',pitfall:'身高和发型只能说明外貌，不能证明善良或耐心。',sentence:'Mia is patient. She listens when I feel worried.',translation:'米娅很有耐心。我担心时，她会听我倾诉。',explain:'先看人物做了什么，再判断这些行为支持哪种品质；不要把自己的喜好当作事实。',animation:{kind:'sequence',actors:['Mia','朋友'],labels:['朋友担心','耐心倾听','patient']},rows:[
 ['哪项最能证明朋友有耐心？','She listens without interrupting.|She is tall.|She has brown hair.','不打断地倾听是耐心的具体表现；另外两项是外貌。'],
 ['He shares his lunch with a classmate. 最能体现哪种品质？','generous|tall|short','分享午餐体现慷慨，tall和short描述身高。'],
 ['She helps me with difficult maths problems. 最能支持哪个判断？','She is helpful.|She has curly hair.|She is the tallest.','帮助解决问题是乐于助人的行为证据。'],
 ['He tells funny stories and makes us laugh. 最适合的品质词是？','humorous|careless|silent','有趣的故事使人发笑，支持幽默这一品质。'],
 ['“My friend has short hair.” 属于哪类信息？','外貌|帮助别人的事例|耐心的证据','短发说明外貌，没有说明待人行为。'],
 ['哪句提供了可以观察到的行为？','She returned the money she found.|She is simply the best.|Everyone must like her.','归还捡到的钱是具体行为，后两句是笼统判断。'],
 ['Sam found a wallet and gave it to a teacher. 哪个结论证据最充分？','Sam acted honestly.|Sam is the tallest student.|Sam never makes any mistake.','交还钱包支持诚实，不支持身高或从不犯错的绝对判断。'],
 ['“She is helpful because she has blue eyes.” 应怎样改进？','把眼睛颜色换成她帮助别人的事例|把helpful换成very helpful即可|只在句末加always','品质与证据应有逻辑联系，增加程度词不能修复无关证据。'],
 ['材料：Ben encourages me when I fail, but sometimes forgets his books. 哪种评价兼顾证据？','He is supportive but sometimes forgetful.|He is perfect in every way.|He never cares about friends.','鼓励朋友和偶尔忘书可以同时成立，不宜用单一绝对评价覆盖两条事实。'],
 ['介绍“耐心又乐于助人”的朋友，哪段证据完整？','She listens to my worries and helps me solve problems.|She has a round face and wears glasses.|She is wonderful, excellent and perfect.','倾听对应耐心，帮助解决问题对应乐于助人；外貌和重复赞词不足以作证。']
 ]});
 add('reading',{id:'portrait',title:'把事例连成介绍',rule:'按人物与外貌 → 品质和事例 → 友谊感受组织介绍。',pitfall:'help sb with sth；主动句 make sb do，不写 make sb to do。',sentence:'My friend helps me with English and makes me laugh.',translation:'我的朋友帮助我学习英语，也逗我开心。',explain:'用一个外貌信息帮助读者认识人物，再用行为描写品质，结尾说友谊对自己的意义。',animation:{kind:'action',actors:['朋友','我'],labels:['认识朋友','帮助学习','一起欢笑']},rows:[
 ['My friend helps me ___ my homework.','with|at|from','help sb with sth表示帮助某人做某事。'],
 ['His jokes make us ___.','laugh|to laugh|laughed','主动语态make sb do，宾语后用原形。'],
 ['介绍朋友时，哪句适合开头交代人物？','My best friend is Lily.|Finally, friendship matters.|That is why I like her.','先明确介绍对象，后两句通常用于总结或承接。'],
 ['哪句话最适合放在介绍朋友的结尾？','I am lucky to have such a friend.|She has black hair.|Her name is Amy.','结尾表达友谊感受；姓名与外貌适合前面的介绍。'],
 ['Tom often helps his sister ___ English.','with|for|on','帮助学习某科用help sb with English。'],
 ['The funny story made me ___.','smile|to smile|smiles','made是make的过去式，后面的宾语补足语仍用原形smile。'],
 ['“姓名与外貌、帮助我的事例、友谊感受”怎样排列更连贯？','姓名与外貌 → 事例 → 感受|感受 → 无关新闻 → 姓名|外貌 → 外貌 → 外貌','从人物介绍到具体证据再到感受，内容逐步展开。'],
 ['She helps me with English. She makes me laugh. 合并后哪句正确？','She helps me with English and makes me laugh.|She helps me English and makes me to laugh.|She helps with me English and make me laugh.','两项并列谓语都与she保持一致，help和make各自保持正确搭配。'],
 ['段落先写“Leo很体贴”，随后突然写“昨天足球比分”。最有效的修改是？','用Leo照顾朋友的事例替换无关比分|加十个形容词赞美Leo|把所有动词改成比较级','段落需要支持主题的证据，不需要无关信息或机械修饰。'],
 ['哪段同时做到结构清楚、搭配正确？','My friend is Amy. She helps me with maths and makes me smile. I value our friendship.|I value it. Amy makes me to smile. Who is she?|Amy is tall. The bus is late. Maths is difficult.','第一段交代人物、行为和感受，help sb with和make sb do也都正确。']
 ]});
 add('forms',{id:'regular',title:'短词加 -er / -est',rule:'短形容词常加 -er / -est；以 e 结尾只加 -r / -st。',pitfall:'比较级和最高级不同；nice 不写 niceer。',sentence:'This tree is taller. That tree is the tallest.',translation:'这棵树更高。那棵树最高。',explain:'tall → taller → tallest；nice → nicer → nicest。先判断比较程度，再检查拼写。',animation:{kind:'compare',actors:['这棵树','那棵树'],labels:['tall','taller','tallest'],values:[35,60,90]},rows:[
 ['tall 的比较级应写作？','taller|tallest|more taller','tall加-er为比较级，不能再叠加more。'],
 ['small 的最高级应写作？','smallest|smaller|smalllest','small直接加-est，不再加第三个l。'],
 ['nice 的比较级应写作？','nicer|niceer|nicest','以e结尾只加-r，写nicer。'],
 ['large 的最高级应写作？','largest|largeest|larger','以e结尾只加-st。'],
 ['My ruler is ___ than yours.（更长）','longer|longest|long','than提示两者比较，用longer。'],
 ['Which box is ___, this one or that one?（更小）','smaller|smallest|small','两个盒子比较，用比较级smaller。'],
 ['选出两种词形都正确的一组。','safe → safer → safest|safe → safeer → safeest|safe → safer → safeest','safe以e结尾，分别加-r和-st。'],
 ['This road is wide. That road is even ___.','wider|widest|wideer','even可修饰比较级；wide以e结尾，用wider。'],
 ['改错：This rope is more longer than that one. 应怎样修改？','删去more|把longer改成longest|在than前加the','longer已是比较级，不与more叠加；两者比较也不用最高级。'],
 ['甲树2米，乙树3米，丙树4米。哪句形式和事实都对？','Tree B is taller than A, and C is the tallest.|Tree B is tallest than A, and C is taller of all.|Tree A is taller than B, and C is tall.','乙比甲高用taller，丙在三者中最高用the tallest。']
 ]});
 add('forms',{id:'spelling',title:'变 y 与双写',rule:'辅音字母 + y：变 y 为 i；big 等短词双写末辅音后加 -er / -est。',pitfall:'happy → happier；big → bigger；不是所有短词都双写。',sentence:'The happier child chose the biggest box.',translation:'更开心的那个孩子选了最大的盒子。',explain:'happy的y前是辅音字母p；big是重读闭音节且末尾为单个辅音字母g。long末尾有两个辅音字母，不双写g。',animation:{kind:'transform',actors:['happy','big'],labels:['happy / big','happier / bigger','happiest / biggest']},rows:[
 ['happy 的比较级正确形式是？','happier|happyer|happiest','辅音字母+y结尾，y变i再加-er。'],
 ['easy 的最高级正确形式是？','easiest|easyest|easier','easy变y为i，加-est。'],
 ['big 的比较级正确形式是？','bigger|biger|biggest','big末尾g需双写后加-er。'],
 ['hot 的最高级正确形式是？','hottest|hotest|hotter','hot双写t再加-est。'],
 ['thin 的比较级应选？','thinner|thiner|thinnest','thin双写n后加-er。'],
 ['heavy 的比较级应选？','heavier|heavyer|heaviest','heavy以辅音字母+y结尾，变y为i。'],
 ['哪组都符合正确拼写？','busy → busier; wet → wetter|busy → busyier; wet → weter|busy → busyer; wet → wetter','busy变y为i；wet双写t。'],
 ['为什么longer不写longger？','long末尾已有两个辅音字母，不套单个末辅音双写规则|所有g结尾的词都不能双写|因为long没有比较级','双写要满足条件，不是看到g就双写或不双写。'],
 ['按要求填easy的比较级和最高级：This test is ___, but that is the ___ of all.','easier; easiest|easyer; easyest|easiest; easier','题目要求第一空用比较级easier；第二空在所有测验中选最容易的，用最高级easiest。两种形式都先把y变成i。'],
 ['三只箱子中红箱最重，蓝箱比绿箱大。哪句完全正确？','The red box is the heaviest, and the blue one is bigger than the green one.|The red box is the heavyest, and the blue one is biger.|The red box is heavier of all, and the blue one is biggest than the green one.','heavy变heaviest，big变bigger；同时要区分最高级范围和than比较。']
 ]});
 add('forms',{id:'irregular',title:'more 与不规则变化',rule:'长形容词常用 more / most；good → better → best，bad → worse → worst。',pitfall:'不能写 more better、most easiest；一个程度只用一种比较形式。',sentence:'This plan is better, but her plan is the best.',translation:'这个计划更好，但她的计划最好。',explain:'careful、interesting等常用more/most。good和bad的变化需要记忆，不能机械加-er。',animation:{kind:'transform',actors:['good','bad'],labels:['good / bad','better / worse','best / worst']},rows:[
 ['good 的比较级是？','better|gooder|best','good不规则变化为better。'],
 ['bad 的最高级是？','worst|baddest|worse','bad的最高级是worst。'],
 ['careful 的比较级应选？','more careful|carefuler|more carefuler','careful通常用more构成比较级。'],
 ['interesting 的最高级应选？','most interesting|interestingest|more interestingest','interesting通常用most构成最高级。'],
 ['This answer is ___ than the first one.（更好）','better|best|good','than前需要比较级better。'],
 ['Of all the plans, this is the ___.（最差）','worst|worse|bad','all所指范围内的最差，用worst。'],
 ['哪组两处都正确？','more helpful; the most helpful|more helpfuler; the most helpful|more helpful; the helpfulest','helpful采用more/most，不再加-er或-est。'],
 ['改错：Her English is more better now. 正确修改是？','删除more|把better改成best而保留more|把more改成most','better本身已经表达“更好”，不能叠加more。'],
 ['两种方法中甲更有用，三种计划中乙最好。应分别使用？','more useful; the best|the most useful; better|usefuller; the goodest','两者比较用more useful，三者中最好用the best。'],
 ['想表达“这本更有趣，但那本是三本中最好的”，哪句正确？','This book is more interesting, but that one is the best of the three.|This book is most interesting, but that one is better of the three.|This book is interestinger, but that one is the goodest.','interesting采用more；good最高级为best，且范围of the three要求最高级。']
 ]});
 add('comparison',{id:'than',title:'两者比较与程度',rule:'两者比较用比较级 + than；much / a little 可以修饰比较级。',pitfall:'very 修饰原级，不能直接修饰 taller；比较双方必须是同一类事物。',sentence:'Her hair is much longer than mine.',translation:'她的头发比我的长得多。',explain:'mine在这里等于my hair，确保比较的是两人的头发；much说明差距大。',animation:{kind:'compare',actors:['我的头发','她的头发'],labels:['比较同类','longer than','much longer'],values:[28,60,90]},rows:[
 ['This bag is ___ heavier than that one.','much|very|most','much可以修饰比较级heavier。'],
 ['She is a little ___ than her brother.','taller|tall|tallest','a little可修饰比较级，than也提示用taller。'],
 ['Her hair is longer than ___.（我的头发）','mine|me|I','mine代表my hair，避免把头发与人比较。'],
 ['The red ruler is shorter ___ the blue one.','than|then|that','比较级后连接比较对象用than。'],
 ['哪种搭配正确？','very tall|very taller|very tallest than','very修饰原级tall，不能直接修饰比较级。'],
 ['This room is ___ than that room.（安静得多）','much quieter|very quieter|most quieter','much修饰比较级quieter，表示差距大。'],
 ['改错：My eyes are bigger than Tom. 应怎样改？','Tom → Tom’s|bigger → biggest|than → then','Tom’s代表Tom’s eyes，保证同类相比。'],
 ['“稍微更轻”而不是“轻得多”，应选？','a little lighter|much lighter|very lighter','a little表示程度小，much表示程度大，very不能这样修饰比较级。'],
 ['甲头发30厘米，乙头发31厘米。哪句同时符合事实和自然程度？','B’s hair is a little longer than A’s.|B’s hair is very longer than A.|A’s hair is much longer than B’s.','乙比甲只长1厘米，用a little longer；双方都是头发。'],
 ['哪句正确比较两位朋友的书包并强调差距大？','Amy’s bag is much heavier than mine.|Amy’s bag is very heavier than me.|Amy’s bag is the heaviest than mine.','much+比较级+than，mine代表my bag，形式、程度和比较对象一致。']
 ]});
 add('comparison',{id:'range',title:'范围内选出最……',rule:'三者或以上的范围内用 the + 最高级；one of 后接最高级和复数名词。',pitfall:'one of the kindest students 中 students 要用复数；不是 the kinder of the three。',sentence:'She is one of the kindest students in our class.',translation:'她是我们班最善良的学生之一。',explain:'先圈出比较范围，再判断是比较两者还是选范围内最突出者。one of表示某一群体中的一个。',animation:{kind:'sequence',actors:['比较范围'],labels:['三者或以上','the + 最高级','one of + 复数']},rows:[
 ['Of the three girls, Amy is ___.（最高）','the tallest|taller|tall','三者中最高用the tallest。'],
 ['He is one of the best ___ in the club.','players|player|a player','one of后接复数名词。'],
 ['She is the youngest ___ our class.','in|than|to','在班级这个范围内用in our class。'],
 ['This is the longest ___ the three rulers.','of|than|from','三把尺子构成一组，用of the three。'],
 ['Ben is ___ most careful student here.','the|a|an','形容词最高级前通常用the。'],
 ['one of the tallest boys 表示什么？','最高的男孩之一|唯一一个男孩|比所有男孩都矮的人','one of指出群体中的一员，不表示唯一。'],
 ['哪句one of结构完整正确？','It is one of the most useful books.|It is one of the most useful book.|It is one of more useful books.','one of the+最高级+复数名词。'],
 ['两者甲乙相比用taller；甲乙丙中选最高应改为？','the tallest of the three|taller of the three|tallest than the three','范围扩大到三者且选最高，需the tallest和of范围短语。'],
 ['“Lily is one of the best swimmers.” 能确定什么？','Lily属于最好的游泳者这一群体|Lily一定是唯一最好的游泳者|所有游泳者成绩都一样','one of不支持“唯一最佳”，也不说明所有人水平相同。'],
 ['已知三位同学身高150、160、170厘米。哪句语法和判断都正确？','The 170-cm student is the tallest of the three.|The 160-cm student is taller of the three.|The 150-cm student is one of the tallest student.','170厘米是三者最高；最高级范围结构与事实一致。']
 ]});
 add('suffixes',{id:'word-feelings',title:'后缀与感受词',rule:'careful / careless 表示细心 / 粗心；bored 是感到无聊，boring 是令人无聊。',pitfall:'不能只按“人用-ed、物用-ing”硬套；boring也能描述令人厌烦的人。',sentence:'The story is boring, so I feel bored.',translation:'这个故事很无聊，所以我感到无聊。',explain:'先判断表达的是感受，还是引起这种感受的特征。-ful和-less也要结合实际词义，不给所有词随意加后缀。',animation:{kind:'transform',actors:['故事','听众'],labels:['boring','引起感受','bored']},rows:[
 ['care 加什么后缀构成“粗心的”？','-less|-ful|-est','careless是粗心的，careful是细心的。'],
 ['helpful 最接近哪个意思？','有帮助的|无帮助的|比较高的','helpful中-ful表示具有帮助作用。'],
 ['I feel ___ during the long talk.（无聊）','bored|boring|bore','描述自己的感受，用bored。'],
 ['The film makes people feel bored. The film is ___.','boring|bored|bore','电影引起无聊的感受，用boring。'],
 ['She checks every answer carefully. She is ___.','careful|careless|hopeless','认真检查答案支持careful，即细心。'],
 ['hopeless 的意思是？','无望的|充满希望的|更加幽默的','-less表示缺少，hopeless为无望的。'],
 ['He only talks about himself, so others think he is ___.','boring|bored|bore','这里评价他令人厌烦，不是说他自己感到无聊。'],
 ['The task is ___. I feel ___.（令人厌烦；无聊）','boring; bored|bored; boring|boring; boring','任务的特征用boring；人的感受用bored。'],
 ['“所有人一律用bored，所有物一律用boring”为什么不准确？','关键是感受与引起感受的性质，人也可能令人厌烦|因为两个词完全同义|因为boring只能用于电影','词形由表达意义决定，不单由名词是否是人决定。'],
 ['朋友认真做事且能帮助他人，哪句词义和搭配都合适？','She is careful and helpful; her lively stories are never boring.|She is careless and helpless because she helps everyone.|She is bored because every story makes us laugh happily.','careful与认真对应，helpful与帮助对应；boring描述故事的性质。']
 ]});
 add('suffixes',{id:'friend-phrases',title:'交友搭配',rule:'be ready to do；keep secrets；get along with sb。',pitfall:'ready 后接 to + 原形；get along with 不能漏 with。',sentence:'She is ready to help and gets along with her classmates.',translation:'她乐于帮助别人，与同学们相处融洽。',explain:'用这些搭配描写真实行为；keep secrets强调不透露朋友托付的信息。',animation:{kind:'action',actors:['同学','朋友'],labels:['ready to help','keep secrets','get along with']},rows:[
 ['He is ready ___ a classmate.','to help|helping|helped','be ready to do后用不定式。'],
 ['A trustworthy friend keeps my ___.','secrets|secretly|secrecy to','keep secrets是保密的常用搭配。'],
 ['I get along well ___ my classmates.','with|to|for','get along with sb表示与某人相处。'],
 ['She is always ready to ___ carefully.','listen|listens|listening','to后用动词原形listen。'],
 ['get along well with 表示？','与……相处融洽|比……长得高|向……借钱','该短语描述人与人之间的相处关系。'],
 ['哪种行为符合keep a secret？','不把朋友托付的私人信息告诉其他同学|把私人信息发到班级群|大声重复朋友不愿公开的话','保密意味着不擅自公开受托的信息。'],
 ['She ___ ready to help and ___ along with everyone.','is; gets|are; get|is; getting','主语she，be用is，一般现在时get用gets。'],
 ['改错：He gets along well his sister. 缺少什么？','well后加with|gets后加to|sister后加than','完整搭配get along well with sb。'],
 ['同学说“我乐于帮忙”，但经常泄露朋友秘密。哪种评价有依据？','可能乐于助人，但保密方面需要改进|只要愿帮忙就一定能保守所有秘密|这说明他身材很高','不同品质需要分别用对应行为评价，不能从一种品质推出所有品质。'],
 ['哪句完整表达“她乐于倾听、替我保密，并与同学友好相处”？','She is ready to listen, keeps my secrets and gets along with classmates.|She is ready listening, keeps secretly and gets along classmates.|She ready to listen, keep my secrets and get along to classmates.','三项搭配和第三人称单数形式都要保持正确。']
 ]});
 window.GrowingEnglishPointCourses.define('english-8a-01',{lessons});
})();
