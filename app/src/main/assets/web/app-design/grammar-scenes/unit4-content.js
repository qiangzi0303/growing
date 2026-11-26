/* Original teaching examples and error-focused exercises; not exam quotations. */
(()=>{
 const lessons={reading:{tab:'学会 DIY',points:[]},imperatives:{tab:'操作步骤',points:[]},advice:{tab:'提出建议',points:[]},prefixes:{tab:'手作介绍',points:[]}};
 const add=(lesson,p)=>lessons[lesson].points.push(p);
 add('reading',{id:'learn-from-errors',title:'从失误到进步',rule:'按尝试 → 问题 → 学习 → 进步整理经历，用证据解释变化。',pitfall:'热爱 DIY 不等于已经会做；危险操作应请成年人协助。',sentence:'After taking a course, Andrew learnt to make a shelf safely.',translation:'参加课程后，安德鲁学会了安全地做书架。',explain:'阅读重点是学习和实践带来的进步，不是鼓励忽略说明或重复危险操作；制作示意不代替工具安全指导。',animation:{kind:'sequence',actors:['Andrew'],labels:['尝试遇到问题','阅读与课程','安全实践进步']},rows:[
 ['阅读DIY经历时，哪组顺序最清楚？','尝试 → 问题 → 学习 → 进步|进步 → 无关天气 → 姓名|只抄每件工具的颜色','经历类文章要把时间与原因联系起来。'],
 ['Andrew参加课程后进步，最能说明什么？','学习有助于改进技能|只要喜欢就绝不会出错|所有工具都可以随意使用','参加课程和进步相联系，支持学习的作用。'],
 ['动手前应该优先做什么？','阅读说明并确认安全要求|跳过说明直接试|把所有工具通电看看','先理解说明和安全要求，不能盲目试用工具。'],
 ['发现涉及电路的危险操作时，应怎样做？','停止自行操作并请成年人或专业人员协助|带电反复尝试|让不懂工具的同学代替自己','安全优先，课堂示意不构成危险操作指导。'],
 ['“After taking a course”主要提示什么？','学习发生在后续动作之前|从来没有上过课|动作与课程无关','after说明先上课程，再发生后续动作。'],
 ['“He improved his skills.”表示？','技能有所提高|技能已经完美且不会再错|他停止所有学习','improved表示进步，不意味着完美或永远不再犯错。'],
 ['材料：第一次书架歪了；他学习测量；第二次更稳。最合理的因果线是？','发现问题 → 学习测量 → 改进作品|作品更稳 → 从未学习|第一次失败 → 永远不能做好','第二次改善与有针对性的学习相联系，不能从一次失败推出永久能力。'],
 ['“Andrew loves DIY, so he never needs instructions.”哪里推断过度？','热爱不能代替知识与安全说明|because不能出现在文章里|DIY只能由一个人完成','兴趣不是充分技能，也不能免除安全要求。'],
 ['先写失误，再写课程，最后写成功作品，作者最可能强调？','通过学习和实践逐步提高|只有结果重要，过程不值得写|每个人首次尝试必然成功','叙事顺序展现改变过程，不能抹去学习步骤。'],
 ['哪份DIY反思最完整、合理？','My first shelf was uneven. I studied the instructions and asked for help. The next one was better.|I made one mistake, so learning never helps.|I like DIY, so I can ignore every safety rule.','识别问题、采取学习措施、陈述改善，构成有证据的反思。']
 ]});
 add('reading',{id:'diy-phrases',title:'热爱、装满与杂乱',rule:'be crazy about doing；fill A with B；in a mess。',pitfall:'fill是动作，be full of是状态；不要混成fill...of。',sentence:'He is crazy about making models, but his room is in a mess.',translation:'他热衷于制作模型，但房间乱七八糟。',explain:'about后接名词或动名词；fill说明“用什么装满什么”，with引出填入的东西。',animation:{kind:'action',actors:['模型爱好者','收纳盒'],labels:['making models','fill with paper','收拾杂乱房间']},rows:[
 ['My brother is crazy ___ making models.','about|to|with','be crazy about sth/doing是固定搭配。'],
 ['Fill the box ___ paper.','with|of|from','fill A with B表示用B装满A。'],
 ['The room is ___ a mess.','in|on|at','in a mess表示乱七八糟。'],
 ['She is crazy about ___ cards.','making|make|to make','about为介词，后用动名词making。'],
 ['The bag is full ___ tools.','of|with|to','表示状态用be full of。'],
 ['“Fill the bottle with water.”哪一个是被装满的容器？','the bottle|water|with','fill后面的the bottle是容器，with后是装入物water。'],
 ['哪组两个搭配都正确？','fill the bag with paper; be full of paper|fill the bag of paper; be full with paper|fill with the bag paper; be full to paper','fill...with表示动作；be full of表示状态。'],
 ['He is crazy about DIY, but his desk is in a mess. but连接什么关系？','热爱DIY与桌面杂乱之间的转折|先后顺序|两个完全同义的词','but表示转折，既喜欢DIY又有杂乱问题。'],
 ['要把“他装满了盒子”改为“盒子现在装满了”，哪组正确？','He filled the box with paper. The box is full of paper now.|He filled the box of paper. The box is full with paper now.|He full the box with paper. The box filled of paper now.','前句动作使用fill...with，后句状态使用be full of。'],
 ['介绍整理模型材料，哪句所有搭配都对？','I am crazy about making models. My desk was in a mess, so I filled a box with spare parts.|I am crazy to making models. My desk was on a mess.|I am crazy about make models and filled a box of spare parts.','about doing、in a mess、fill...with三处搭配分别正确。']
 ]});
 add('imperatives',{id:'commands',title:'原形开头与否定',rule:'祈使句用动词原形开头；否定用 Don’t + 原形，包括 Don’t be。',pitfall:'不要写Doesn’t touch，也不要省略Don’t be careless中的be。',sentence:'Read the instructions. Don’t touch the sharp edge.',translation:'阅读说明。不要碰锋利的边缘。',explain:'祈使句通常省略主语you；肯定和否定都保留动词原形。若谓语表达状态，仍需要be。',animation:{kind:'choice',actors:['操作者'],labels:['Read first','触碰锋利边缘？','Don’t touch']},rows:[
 ['___ the instructions before you begin.','Read|Reads|Reading','祈使句以原形Read开头。'],
 ['___ the sharp edge.（不要碰）','Don’t touch|Doesn’t touch|Not touching','否定祈使句用Don’t+动词原形。'],
 ['___ careful with the tools.','Be|Is|Being','表达“当心”用祈使句Be careful。'],
 ['不要粗心：Don’t ___ careless.','be|is|being','Don’t后用动词原形be，不能省略。'],
 ['___ your work before handing it in.','Check|Checks|To checking','祈使句以原形Check开头。'],
 ['Don’t ___ tools on the floor.','leave|leaves|leaving','Don’t后接动词原形leave。'],
 ['哪句否定表达正确？','Don’t be late.|Don’t late.|Doesn’t be late.','late是形容词，不能省略be；祈使句否定用Don’t。'],
 ['把“Put the bag here.”改成否定祈使句，应选？','Don’t put the bag here.|Not put the bag here.|Don’t putting the bag here.','在动词原形前加Don’t，不改变put的形式。'],
 ['“Be careful.”和“Don’t be careless.”为什么都需要be？','careful和careless是形容词，需要be构成谓语|因为所有英语句子都要be|因为Don’t后必须用过去式','形容词本身不能像动作动词那样独立作此处谓语。'],
 ['哪组同时给出正确、安全的操作提醒？','Read the instructions. Don’t touch sharp edges. Be careful.|Reads the instructions. Not touch sharp edges.|Reading the instructions. Don’t careless.','三句分别使用原形、Don’t+原形、Be+形容词，提醒清晰。']
 ]});
 add('imperatives',{id:'steps',title:'礼貌请求与步骤',rule:'Please 可放句首或句尾；Let’s + 原形；用 First / Next / Finally 排步骤。',pitfall:'Let’s后不接to do；顺序词必须与实际步骤相符。',sentence:'First, read the instructions. Next, mark the paper. Finally, fold it.',translation:'先读说明，再在纸上做标记，最后把纸折好。',explain:'一步一句，先后顺序应能实际执行。Please调整语气，但不会把动词变成第三人称或不定式。',animation:{kind:'sequence',actors:['折纸者'],labels:['Read','Mark','Fold']},rows:[
 ['Let’s ___ a paper card.','make|to make|making','Let’s后用动词原形make。'],
 ['Please ___ the instructions.','read|reads|reading','please不改变祈使句的原形要求。'],
 ['“首先”通常用哪个步骤词？','First|Finally|However','First引出第一步。'],
 ['“最后一步”最适合用哪个词引出？','Finally|First|Because','Finally用于最后一步。'],
 ['把please放句末，哪句正确？','Pass me the paper, please.|Passes me the paper, please.|To pass me the paper, please.','原形Pass引出祈使句，please可放句尾，常用逗号分开。'],
 ['Let’s后面的动词应该用哪种形式？','原形|过去式|带to的不定式','Let us do中do为原形。'],
 ['折纸前要标记，标记前先读说明。哪组顺序正确？','Read → Mark → Fold|Fold → Read → Mark|Mark → Fold → Read','根据题干的先后条件，先读说明，再标记，最后折叠。'],
 ['哪句既礼貌又保持正确的动词形式？','Please put the materials here.|Please puts the materials here.|Please to put the materials here.','please后继续用祈使句原形put。'],
 ['步骤写“Finally, read the instructions”，但说明决定后续操作。主要问题是？','把应当在动手前做的事放到了最后|finally只能用于过去时|read必须改成reads','问题是实际逻辑顺序，不是finally的时态限制。'],
 ['选择可执行、语法正确的折纸说明。','First, read the guide. Next, mark the paper. Finally, fold it. Let’s check the result.|First, folds it. Next, reading the guide. Let’s to check.|Finally, finish it. First, check the unknown result. Let’s checking.','原形与Let’s do正确，先理解再操作再检查，顺序清晰。']
 ]});
 add('advice',{id:'should',title:'should 后用原形',rule:'should / shouldn’t + 动词原形；第三人称也不加 -s。',pitfall:'She should asks不正确；shouldn’t后也不能用to do。',sentence:'She should ask an adult for help. She shouldn’t work alone.',translation:'她应当向成年人求助，不应独自操作。',explain:'should提出建议，主语换成he或she也不改变后面的动词形式。',animation:{kind:'choice',actors:['学生','成年人'],labels:['遇到不熟悉工具','should ask','shouldn’t work alone']},rows:[
 ['She should ___ for help.','ask|asks|to ask','情态动词should后用原形ask。'],
 ['You shouldn’t ___ alone.','work|works|working','shouldn’t后同样用动词原形。'],
 ['He should ___ careful.','be|is|to be','should后用be原形。'],
 ['We ___ ignore the instructions.（不应该）','shouldn’t|shouldn’t to|don’t should','should的否定是should not，缩写shouldn’t。'],
 ['They should ___ the room tidy.','keep|keeps|keeping','should后接原形keep。'],
 ['She shouldn’t ___ the tools on the floor.','leave|leaves|left','否定情态结构后用原形leave。'],
 ['改错：My brother should wears gloves when required. 应改哪里？','wears → wear|should → shoulds|when → than','主语虽为单数，should后的动词仍用原形。'],
 ['哪句同时正确表达建议与否定建议？','You should read first and shouldn’t rush.|You should reading first and shouldn’t to rush.|You should reads first and don’t should rush.','should read和shouldn’t rush都使用原形。'],
 ['She should ask for help. 这句话是否证明她已经求助？','不能，只表达建议|能，should是完成时|能，所有建议都已经执行','提出建议不等于行为已经发生，不能混淆义务/建议和事实。'],
 ['同学不熟悉工具又准备单独操作，哪条建议完整且正确？','You should ask an adult for help and shouldn’t use unfamiliar tools alone.|You should asks an adult and shouldn’t to work alone.|You should ignore the instructions because you like DIY.','既有正确should结构，也直接回应缺经验和独自操作的问题。']
 ]});
 add('advice',{id:'had-better',title:'had better 与否定',rule:'had better + 原形；否定是 had better not + 原形，提醒语气较强。',pitfall:'这里had不表示过去；不写had not better或had better to do。',sentence:'You had better read the instructions. You had better not rush.',translation:'你最好读一下说明，最好不要匆忙动手。',explain:'把had better作为整体记忆。not放在better后，动词前；语境常是在提醒当前或将来的行为。',animation:{kind:'sequence',actors:['操作者'],labels:['先读说明','had better read','had better not rush']},rows:[
 ['You had better ___ the guide first.','read|to read|reading','had better后用原形read。'],
 ['“最好不要跑”的正确句子是？','You had better not run.|You had not better run.|You had better don’t run.','否定结构是had better not do。'],
 ['He had better ___ careful.','be|is|to be','had better后用原形be。'],
 ['We had better not ___ time.','waste|wastes|wasting','not后仍使用原形waste。'],
 ['had better中的had是否一定表示过去？','不是，常用于当前或将来的建议|是，只能说昨天|是，所以后面必须用过去式','had better是固定建议结构，had不按一般过去时理解。'],
 ['“最好现在离开”应选？','You had better leave now.|You had better left now.|You had better to leave now.','即使建议现在的行动，也用had better+原形。'],
 ['哪组肯定与否定都正确？','had better check; had better not rush|had better to check; had not better rush|had better checking; had better don’t rush','肯定后用原形，否定在better后加not。'],
 ['It may rain soon. You had better ___ an umbrella.','take|took|to take','针对即将下雨的建议，take保持原形，had不表示过去。'],
 ['You’d better not start until an adult arrives. 重点提醒什么？','成年人到来前最好不要开始|昨天一定没有开始|成年人一到就必须立即开始','not start until说明此前不要开始，并不证明过去事实或强制立即开始。'],
 ['缺少说明且成人尚未到场，哪句提醒最合适？','You had better read the guide and had better not begin alone.|You had better to read the guide and had not better begin alone.|You had better began alone because had is past tense.','两个had better结构都正确，并对应先看说明、避免独自操作的需要。']
 ]});
 add('prefixes',{id:'negative-prefixes',title:'否定前缀随词记',rule:'unhappy、incorrect、impossible；un- / in- / im- 不能随意互换。',pitfall:'不是给任何词都加un；possible的反义词是impossible。',sentence:'An incorrect measurement can make the result unsuitable.',translation:'错误的测量可能使结果不合适。',explain:'记住已经核对的完整词形，再根据句意选肯定或否定。前缀改变含义，不是比较级。',animation:{kind:'transform',actors:['正确词形'],labels:['happy → unhappy','correct → incorrect','possible → impossible']},rows:[
 ['possible 的反义词应写作？','impossible|unpossible|inpossible','固定词形impossible，不能随意更换前缀。'],
 ['happy 的反义词应写作？','unhappy|inhappy|imhappy','happy对应unhappy。'],
 ['correct 的反义词应写作？','incorrect|uncorrect|imcorrect','correct对应incorrect。'],
 ['“不安全的”应选？','unsafe|insafe|imsafe','safe的常用反义词是unsafe。'],
 ['“不耐心的”应选？','impatient|unpatient|inpatient（住院病人）','表示不耐心用impatient；inpatient是住院病人，含义不同。'],
 ['Which word means “not possible”?','impossible|possible|possibly','impossible表示不可能，possibly是副词“可能”。'],
 ['哪组词形都正确？','unhappy; incorrect; impossible|inhappy; uncorrect; impossible|unhappy; imcorrect; unpossible','不同词选择的前缀需要按已知词形记忆。'],
 ['句意“这个答案错了”，应填The answer is ___.','incorrect|correct|correction','is后用形容词；incorrect符合否定含义，correction是名词。'],
 ['同学说“所有以p开头的词都能加im-”，为什么不能照此造词？','前缀有规律但受词汇限制，需核对完整词形|因为所有词都应加un-|因为否定前缀都表示最高级','常见规律不能代替词汇验证，不能机械造不存在的词。'],
 ['作品尺寸错了，装不上并让作者不开心。哪组词符合语境？','incorrect measurements; impossible to fit; unhappy|correct measurements; impossible to fit; inhappy|imcorrect measurements; unpossible to fit; unhappy','incorrect、impossible、unhappy分别是正确的否定词形，且与语境吻合。']
 ]});
 add('prefixes',{id:'diy-writing',title:'并列与替代',rule:'not only ... but also ... 连接对应成分；instead of 后接名词或 doing。',pitfall:'instead可单独用，instead of要有宾语；不要写instead of buy。',sentence:'We use old boxes instead of buying new ones. DIY not only saves money but also brings joy.',translation:'我们使用旧盒子，不买新盒子。DIY既省钱又带来乐趣。',explain:'介绍手作按材料、步骤、结果、感受展开；用并列结构表达两项益处，用instead of说明材料或做法的替代。',animation:{kind:'sequence',actors:['旧盒子','手作者'],labels:['reuse boxes','instead of buying','save money + joy']},rows:[
 ['We reuse boxes instead of ___ new ones.','buying|buy|to buy','of为介词，后接动名词buying。'],
 ['DIY not only saves money ___ brings joy.','but also|and but|or also','固定搭配not only...but also...。'],
 ['I had no red paper, so I used blue paper ___.','instead|instead of|instead to','句末没有宾语时可用副词instead，不能单独留下instead of。'],
 ['We use paper instead of ___.','plastic|to plastic|plastics to','instead of后可接名词plastic，表示替代材料。'],
 ['手作介绍中“纸、胶水、旧盒子”属于哪一部分？','材料|最终感受|比较范围','这些是制作所需材料，应先交代。'],
 ['哪组符合清楚的手作介绍顺序？','材料 → 步骤 → 结果 → 感受|感受 → 无关比分 → 日期|只写材料的颜色','说明用什么、怎么做、做成什么及感受，信息完整。'],
 ['哪句并列结构最一致？','DIY not only saves money but also reduces waste.|DIY not only saves money but also reducing waste.|DIY not only save money but also reduces waste.','同一主语DIY后两个谓语都用第三人称单数saves和reduces。'],
 ['“不买礼物，改为自己做”，哪句正确？','We make gifts instead of buying them.|We make gifts instead buying them.|We make gifts instead of buy them.','instead of+动名词buying，them指gifts。'],
 ['把“It is useful and brings joy.”改写为not only连接两个形容词，哪句正确？','It is not only useful but also enjoyable.|It is not only useful but also enjoyably.|It not only useful but also brings joyful.','两项都是形容词useful/enjoyable，由is支配；enjoyably是副词，不适合这里的并列结构。'],
 ['哪段完整介绍环保手作且搭配正确？','We used old boxes instead of buying new ones. First, we marked them; next, we folded them into holders. The holders not only save money but also reduce waste. We are pleased with them.|We used boxes instead of buy new. Not only useful but also happily.|We like DIY. It is good. Yesterday was sunny.','第一段包含材料、步骤、结果和感受；instead of doing及not only...but also...都正确。']
 ]});
 window.GrowingEnglishPointCourses.define('english-8a-04',{lessons});
})();
