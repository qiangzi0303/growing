/* Original error-focused practice aligned with the existing upper-book Unit 7 scope. */
(()=>{
 const lessons={};
 const add=(lesson,tab,p)=>{(lessons[lesson]||={tab,points:[]}).points.push(p);};
 add('reading','生态系统',{
  id:'members-functions',title:'组成与功能',rule:'生态系统包含生物与非生物；用功能理解教材中的器官比喻。',pitfall:'森林被比作肺，不表示森林真的拥有人的肺部结构。',
  sentence:'Wetlands store water and help clean it.',translation:'湿地储存水，并帮助净化水。',explain:'按“类型→组成→功能”读信息；教材把海洋、湿地、森林比作心脏、肾脏、肺，用来说明相关作用。',
  animation:{kind:'sequence',actors:['湿地','森林'],labels:['生物 + 水土空气','湿地蓄水净水','森林提供家园']},rows:[
   ['生态系统的组成应包括？','生物和非生物成分|只有动物|只有高大的树木','水、土壤、空气等非生物成分也是生态系统的一部分。'],
   ['哪项属于生态系统中的非生物成分？','水|鸟|树','水不是生物；鸟和树是生物。'],
   ['本课把湿地比作地球的什么？','肾脏|眼睛|骨骼','教材用肾脏比喻湿地的净水等作用。'],
   ['本课用“地球的肺”比喻哪类生态系统？','森林|机场|公路','森林与净化空气等功能有关，教材以肺作比喻。'],
   ['“Forests provide homes for wildlife.”直接说明？','森林提供野生动物栖息地|森林只含树木|野生动物不需要水','provide homes 强调栖息地功能。'],
   ['“Wetlands store water.”中的 store 表示？','储存|商店这个地点|购买','此处 store 是动词，宾语为 water。'],
   ['海洋被比作心脏、森林被比作肺，阅读时应怎样处理？','理解功能上的类比，不当作真实人体器官|认定地球有人的骨骼和血液|只记器官名，忽略生态功能','比喻用熟悉事物帮助理解作用，不是解剖事实。'],
   ['若笔记只列“鸟、鱼、树”，要补全生态系统组成还需？','水、空气、土壤等非生物成分|更多鸟的名字就足够|仅把树改成复数','增加生物种类仍不能替代非生物成分。'],
   ['一段写“湿地蓄水净水，为生物提供栖息地”。哪种概括最准确？','湿地有水环境与栖息地等多方面作用|湿地唯一作用是装饰风景|任何湿地都能立即净化一切污染','材料支持多个功能，不支持唯一作用或无限净化能力。'],
   ['做生态系统信息卡，哪一组栏目最完整？','类型→生物与非生物组成→功能→保护意义|名称→字体大小→页码颜色|只列动物，不写环境和功能','完整信息卡需要把组成、功能与保护联系起来。']
  ]
 });
 add('reading','生态系统',{
  id:'cause-balance',title:'因果与生态平衡',rule:'lead to 表示导致；get rid of 表示清除；keep a balance 表示保持平衡。',pitfall:'先分清原因、后果和对策，不把保护措施写成污染的原因。',
  sentence:'Water pollution can lead to serious problems. We should keep a balance in nature.',translation:'水污染会导致严重问题。我们应保持自然界的平衡。',explain:'lead to 后指出后果；保护措施要针对前面的问题。清理垃圾是行动，清洁水体是希望达到的结果。',
  animation:{kind:'sequence',actors:['水体','保护者'],labels:['污染：原因','生态受损：后果','清理垃圾：行动']},rows:[
   ['Water pollution can lead ___ problems.','to|for|at','lead to 表示导致。'],
   ['We need to get rid ___ the rubbish.','of|from|with','get rid of 是固定搭配。'],
   ['We should keep a ___ in nature.','balance|balancedly|balancingly','keep a balance 表示保持平衡。'],
   ['“Pollution leads to fewer fish.”中原因是？','污染|鱼变少|保护行动','lead to 前为原因，后为结果。'],
   ['“Get rid of rubbish”主要表达？','清除垃圾|制造垃圾|忽视垃圾','get rid of 表示去除。'],
   ['哪项是针对水中垃圾的直接行动？','Keep rubbish out of rivers.|Paint every bird blue.|Count classroom desks.','避免垃圾进入河流与问题对应。'],
   ['“树木减少→栖息地减少”，哪句因果方向正确？','Fewer trees can lead to fewer homes for birds.|More bird homes must lead to fewer trees.|Protecting forests always causes water pollution.','第一句正确表达题目给出的方向，另两句添加或颠倒关系。'],
   ['清理垃圾后水面更干净，哪项结论最稳妥？','这项行动有助于改善水面状况|全部生态问题已经永久解决|水下永远不会再有污染','局部改善不能证明所有问题永久解决。'],
   ['材料说“填埋湿地减少蓄水空间，暴雨后更易积水”。哪组因果链正确？','填埋→蓄水空间减少→积水风险增加|积水→保护湿地→蓄水空间必然消失|清理垃圾→填埋必然停止→再无暴雨','按材料整理中间环节，不加入无依据的必然关系。'],
   ['社区河道有垃圾，建议书哪段能连起问题、行动和理由？','Rubbish pollutes the river. Keep rubbish out of it to protect its ecosystem.|The river is long. My favourite colour is blue.|Pollution is a problem, so we should add more rubbish.','行动直接针对污染，理由说明生态保护意义。']
  ]
 });
 add('double-object','主谓双宾语',{
  id:'to-transfer',title:'给谁什么：to',rule:'give / show / send / teach sb sth 可改为动词 + sth + to sb。',pitfall:'两种语序中“接受者”和“物品”交换位置时，to 不能漏掉。',
  sentence:'I showed my friend a photo. I showed a photo to my friend.',translation:'我给朋友看了一张照片。',explain:'my friend 是间接宾语（接受者），a photo 是直接宾语（展示的东西）；换序后用 to 连接接受者。',
  animation:{kind:'action',actors:['我','朋友'],labels:['show my friend','a photo','a photo to my friend']},rows:[
   ['“She gave me a book.”中 me 是？','间接宾语|直接宾语|谓语','me 指书的接受者；a book 为直接宾语。'],
   ['“She gave me a book.”中直接宾语是？','a book|me|She','被给予的物品 a book 是直接宾语。'],
   ['He showed the map ___ us.','to|for|of','show sth to sb。'],
   ['Please send this letter ___ Amy.','to|for|at','send sth to sb 表示把某物寄给某人。'],
   ['“Teach us English”换一种语序为？','Teach English to us.|Teach English us.|Teach to English us.','teach sb sth 转为 teach sth to sb。'],
   ['“Dad gave a pen to me.”对应的双宾语句是？','Dad gave me a pen.|Dad gave to me pen.|Dad gave a me pen.','接受者置前时直接接 me，然后接 a pen。'],
   ['选出两处搭配都对的句子。','She sent me a card and showed a photo to him.|She sent a card me and showed him to a photo.|She sent to me a card him and showed for a photo.','send sb sth 与 show sth to sb 分别成立。'],
   ['“I showed my friend the river.”改为物品在前时，哪项正确？','I showed the river to my friend.|I showed the river my friend.|I showed to the river my friend.','the river 是展示对象，to my friend 为接受者。'],
   ['“The guide showed the visitors a wetland map.”哪些分别是 IO 与 DO？','the visitors；a wetland map|the guide；the visitors|a wetland map；showed','主语 guide，谓语 showed，接受者 visitors，展示物 map。'],
   ['给新同学地图并教他几个单词，哪句准确？','I gave him a map and taught some words to him.|I gave a map him and taught to some words him.|I gave him to a map and taught some words for him.','give sb sth、teach sth to sb 均符合本课双宾语变换。']
  ]
 });
 add('double-object','主谓双宾语',{
  id:'for-benefit',title:'为谁准备：for',rule:'buy / make / cook sb sth 可改为动词 + sth + for sb。',pitfall:'to 和 for 由动词搭配决定，不能见到人就统一选 to。',
  sentence:'Mum bought me a coat. Mum bought a coat for me.',translation:'妈妈给我买了一件外套。',explain:'buy、make、cook 强调为某人准备东西，物品在前时常用 for；show、give 则用 to。',
  animation:{kind:'action',actors:['妈妈','孩子'],labels:['buy a coat','for me','为接受者准备']},rows:[
   ['Dad bought a notebook ___ me.','for|to|at','buy sth for sb。'],
   ['She made a card ___ her teacher.','for|to|from','make sth for sb 表示为某人制作。'],
   ['Grandpa cooked dinner ___ us.','for|to|of','cook sth for sb。'],
   ['“Mum bought me a coat.”中 coat 是什么？','直接宾语|间接宾语|主语','coat 为买来的东西，me 为受益者。'],
   ['“He made a model for Amy.”改成双宾语形式是？','He made Amy a model.|He made for Amy model.|He made Amy to a model.','make sb sth，不把 for 保留在 sb 前。'],
   ['哪一组动词通常用 sth for sb 的变换？','buy / make / cook|give / show / send|be / seem / become','为某人买、做、烹饪使用 for。'],
   ['She bought a present ___ me and gave it ___ me.','for; to|to; for|to; to','buy 配 for，give 配 to；同一个人不决定介词。'],
   ['“He cooked us soup.”与“He showed us a photo.”换序后分别用？','soup for us；a photo to us|soup to us；a photo for us|soup us；a photo us','cook 与 show 的动词搭配不同。'],
   ['“She made me happy.”能否照搬 make sb sth 改成 made happy for me？','不能；happy描述me，不是制作的物品|能；只要make后有人就用for换序|能；happy是可递送的物品','这里是宾语加形容词补足语，不是双宾语。'],
   ['社团活动中“给朋友做海报，再给他看”，哪句正确？','I made a poster for my friend and showed it to him.|I made a poster to my friend and showed it for him.|I made for a poster my friend and showed to it him.','先用 make sth for sb，再用 show sth to sb。']
  ]
 });
 add('complement','宾语补足语',{
  id:'object-description',title:'说明宾语状态或身份',rule:'S + V + O + C 中，C 补充说明宾语的状态、身份或动作。',pitfall:'clean 描述 water，并不是给 water 的另一件东西。',
  sentence:'We keep the river clean. We call the bird Snowy.',translation:'我们保持河流清洁。我们把这只鸟叫作 Snowy。',explain:'clean 表明 river 的状态；Snowy 是 bird 的名字。两者都和前面的宾语形成描述关系。',
  animation:{kind:'transform',actors:['河流','小鸟'],labels:['river → clean','bird → Snowy','状态 / 名字']},rows:[
   ['“We keep the water clean.”中 clean 是？','宾语补足语|直接宾语|主语','clean 补充描述 water 的状态。'],
   ['“The news made us happy.”中 happy 描述？','us|news的长度|made的时态','happy 说明 us 因消息而产生的状态。'],
   ['“We call him Ben.”中 Ben 表示？','him的名字|给他的物品|动作发生的时间','Ben 是宾语 him 的身份名称。'],
   ['“They found the room empty.”中宾语是？','the room|empty|They','find 的对象是 the room，empty 补充说明房间状态。'],
   ['Please keep the classroom ___.','clean|cleanly|cleanlinesses','keep O + 形容词，clean 描述 classroom。'],
   ['“We painted the door green.”中 green 的作用是？','补充门被涂成的颜色|表示拿给门的礼物|充当主语','green 描述宾语 the door 的结果状态。'],
   ['“The story made the children excited.”的 O、C 分别为？','the children；excited|The story；the children|excited；made','被影响的是孩子，excited 描述他们的状态。'],
   ['“I found the book useful.”为何 useful 不是第二个宾语？','它描述book的性质，不是另一件给予物|它是一个人的名字|find后永远不能有宾语','book useful 可理解为书有用，形成描述关系。'],
   ['“They asked us to wait.”中 to wait 与 us 的关系是？','说明被要求由us实施的动作|表示给us的一件物品|说明They的名字','不定式可作宾补，具体形式仍依 ask sb to do。'],
   ['描述环保活动结果“我们保持河流清洁，这使大家高兴”，哪句准确？','We kept the river clean. This made everyone happy.|We kept cleanly the river. This made everyone happily.|We kept the river a clean. This made happy to everyone.','两句都使用宾语加形容词补足语，分别描述河流和人的状态。']
  ]
 });
 add('complement','宾语补足语',{
  id:'two-objects-or-complement',title:'双宾语还是宾补',rule:'双宾语问“给谁什么”；宾补问“宾语是什么、怎样或做什么”。',pitfall:'不能只数动词后的两个词；要看两者之间是否形成描述关系。',
  sentence:'She made me a card. She made me happy.',translation:'她给我做了一张卡片。她让我很高兴。',explain:'a card 是做给我的物品，为直接宾语；happy 是我的状态，为宾语补足语。',
  animation:{kind:'choice',actors:['她','我'],labels:['给我卡片：双宾语','让我开心：宾补','物品 ≠ 状态']},rows:[
   ['哪句含双宾语？','She gave me a pen.|She made me happy.|We call him Ben.','me 为接受者，a pen 为物品；其余后项说明宾语。'],
   ['哪句含宾语补足语？','We found the room quiet.|We sent him a card.|We bought her a book.','quiet 描述 room 的状态。'],
   ['“He bought his sister a bag.”属于？','S + V + IO + DO|S + V + O + C|S + V + P','sister 为受益者，bag 为购买物。'],
   ['“We call our dog Lucky.”属于？','S + V + O + C|S + V + IO + DO|S + V','Lucky 是 dog 的名字，不是给狗的物品。'],
   ['“She made us soup.”中 soup 是？','直接宾语|宾语补足语|表语','soup 是为 us 制作的东西。'],
   ['“The film made us sad.”中 sad 是？','宾语补足语|间接宾语|直接宾语','sad 是 us 的状态。'],
   ['“Mum made me a cake.”与“Mum made me careful.”核心区别在于？','cake是物品，careful描述me|两句都有me，所以结构完全相同|两句都有made，所以后项都是物品','意义关系决定是双宾语还是宾补。'],
   ['“He showed us the way.”和“He found the way difficult.”分别属于？','双宾语；宾补|宾补；双宾语|两句都是主系表','第一句给 us 展示 way；第二句 difficult 描述 way。'],
   ['“They named the child Rose.”虽然 Rose 是名词，仍是宾补，理由是？','Rose是child的名字，与宾语形成身份关系|名词都只能当宾语|Rose是递给孩子的一朵花，句中已明确','name 在这里表示命名，不能只根据词性数宾语。'],
   ['活动记录“给游客一张地图；保持路线清晰；把志愿者叫作向导”，结构依次是？','双宾语；宾补；宾补|宾补；双宾语；双宾语|三句都为双宾语','give visitors a map 为给谁什么；keep route clear、call volunteer a guide 为描述关系。']
  ]
 });
 add('conjunctions','并列连词',{
  id:'logic-links',title:'先判断句间逻辑',rule:'and 添加，but 转折，or 选择，so 结果。',pitfall:'不是看到两个完整句子就用 and；先判断它们表达什么关系。',
  sentence:'The task is hard, but we will try. It is raining, so we stay inside.',translation:'任务很难，但我们会尝试。下雨了，所以我们留在室内。',explain:'hard 与 will try 形成转折；raining 是 stay inside 的原因，so 引出结果。',
  animation:{kind:'choice',actors:['学习者','同伴'],labels:['添加：and','转折：but','结果：so']},rows:[
   ['I like birds ___ I enjoy watching them.（添加相关信息）','and|but|or','两项顺接添加，用 and。'],
   ['The room is small ___ comfortable.（虽小但舒适）','but|so|or','表达与预期不同的转折，用 but。'],
   ['Would you like tea ___ water?（二选一）','or|so|but','提供选择，用 or。'],
   ['It was cold, ___ we closed the window.','so|or|because','关窗是天冷的结果，用 so。'],
   ['“The work is difficult, but I will try.”中 but 表示？','转折|原因|单纯选择','困难与仍愿尝试构成转折。'],
   ['“The river was dirty, so we cleaned it.”中结果是？','我们清理了河流|河流很脏|河流长度增加','so 后引出采取清理行动的结果。'],
   ['“We can walk or take a bus.”是否要求两种方式都做？','不要求，or提供选择|要求先走完全程再坐公交|表示两种方式都不可能','or 表选择，不等同于 and。'],
   ['“He was tired ___ happy after the cleanup.”若强调虽累但开心，应选？','but|so|because','tired 与 happy 在此形成情境转折。'],
   ['“It rained, ___ the path became wet, ___ we walked carefully.”两空最佳搭配？','so; so|but; or|or; but','雨导致路湿，路湿促使小心走，两个结果关系都成立。'],
   ['保护活动通知“可以捡垃圾或做海报；任务辛苦但有意义”，哪句符合逻辑？','You can collect rubbish or make posters. The work is hard but meaningful.|You can collect rubbish so make posters. The work is hard or meaningful.|You can collect rubbish but because posters. The work is hard so not meaningful.','or 对应选择，but 对应辛苦与有意义的转折。']
  ]
 });
 add('conjunctions','并列连词',{
  id:'negative-warning',title:'because / so 与否则',rule:'同一因果主从句不重复用 because 和 so；否定并列及“否则”常用 or。',pitfall:'I cannot speak French or German 表示两种都不会，不能误读成任选一种不会。',
  sentence:'Because it rained, we stayed home. Hurry up, or you will miss the bus.',translation:'因为下雨，我们留在家里。快一点，否则你会错过公交车。',explain:'第一句已用 because 说明原因，不再加 so；祈使句后的 or 引出不照做的后果。',
  animation:{kind:'choice',actors:['赶车者','公交车'],labels:['Hurry up','否则：or','miss the bus']},rows:[
   ['哪句正确表达下雨与留在家的因果？','Because it rained, we stayed home.|Because it rained, so we stayed home.|Because so it rained, we stayed home.','because 与 so 不在这一组句中重复连接。'],
   ['I cannot speak French ___ German.（两种都不会）','or|so|because','否定句中并列两个对象常用 or。'],
   ['Hurry up, ___ you will miss the bus.','or|because|so that','祈使句 + or 表示否则会发生不利后果。'],
   ['“Wear warm clothes, or you may feel cold.”中 or 意为？','否则|因为|并且一定','不穿暖可能觉得冷，or 引出条件未满足的后果。'],
   ['“Because the water is dirty, so we should clean it.”可怎样修改？','删去so|再加一个because|把dirty改为dirtly','保留 because 原因从句时，不再重复 so。'],
   ['No food ___ drinks are allowed in this room.','or|so|because','否定范围内连接食物、饮料用 or。'],
   ['“It was late, so we went home.”若改用 because，应为？','Because it was late, we went home.|Because it was late, so we went home.|We went home because so it was late.','改为 because 引导原因时移除 so。'],
   ['“Be quiet, or you may disturb the birds.”最准确的意思是？','保持安静，否则可能惊扰鸟儿|保持安静，因为鸟儿已经全部飞走|安静与惊扰鸟儿任选一项都同样受鼓励','or 在这里是警示后果，不是平等推荐两种选项。'],
   ['“I have no paper or pens.”可推出什么？','我既没有纸，也没有笔|我有纸，只是没有笔|我没有纸，但一定有笔','no 的否定范围覆盖 or 连接的两个对象。'],
   ['通知“因为要保护鸟类，请保持安静，否则会惊扰它们”，哪句清楚正确？','Because we want to protect birds, please be quiet, or you may disturb them.|Because we want to protect birds, so please be quiet because or disturb them.|Please be quiet, so you may disturb birds because so.','because 解释目的背景；or 引出不保持安静的后果，没有重复因果连接。']
  ]
 });
 add('writing','词形与环保建议',{
  id:'adverb-forms',title:'形容词与副词',rule:'形容词描述名词或状态，副词常说明动作方式；friendly 是形容词。',pitfall:'不能见到 -ly 就当副词；good 的常用副词是 well，不是 goodly。',
  sentence:'The friendly guide speaks quietly and explains the rules well.',translation:'友好的向导轻声说话，把规则解释得很好。',explain:'friendly 修饰 guide；quietly 修饰 speaks；well 修饰 explains。happy 变副词要改 y 为 i 再加 ly。',
  animation:{kind:'transform',actors:['向导','游客'],labels:['quiet → quietly','happy → happily','good → well']},rows:[
   ['Please listen ___ to the guide.','carefully|careful|carefulness','修饰 listen 的方式用副词 carefully。'],
   ['She is ___ to visitors.','friendly|friendlily|friend','friendly 是形容词，在这里作表语。'],
   ['The children smiled ___.','happily|happy|happiness','修饰 smiled 用 happily，y 改 i 再加 ly。'],
   ['He explains the rules ___.（解释得好）','well|good|goodly','good 对应常用副词 well。'],
   ['The ___ boy helped us.','careful|carefully|carefulness','修饰名词 boy 用形容词 careful。'],
   ['Please walk ___ in the wetland.（安静地）','quietly|quiet|quietness','修饰 walk 用副词 quietly。'],
   ['选出两空正确形式：She is a ___ guide and works ___.','careful; carefully|carefully; careful|carefulness; careful','前空修饰 guide，后空修饰 works。'],
   ['为什么不能说“Every -ly word is an adverb”？','friendly等-ly词是形容词|因为所有-ly词都是动词|因为英语没有副词','词尾是线索，不是唯一判据，需记例外与句法位置。'],
   ['“She looks happy and speaks happily.”中两个形式不同，是因为？','looks后描述状态，speaks后说明动作方式|happy只能放在句中第一个位置|happily表示过去，happy表示现在','系动词后用形容词，动作方式用副词。'],
   ['给导游写评价，哪句词形都正确？','Our friendly guide explained the rules clearly and did the job well.|Our friendlily guide explained the rules clear and did the job goodly.|Our friendly guide explained the rules clearness and did the job good.','friendly 修饰人，clearly/well 修饰动作，各自词形与位置匹配。']
  ]
 });
 add('writing','词形与环保建议',{
  id:'practical-advice',title:'问题—行动—理由',rule:'环保建议信写清问题、可实行的行动和理由，结尾表达期待。',pitfall:'“大自然很美”是看法，不是具体的保护行动。',
  sentence:'We should keep rubbish out of the water because it can harm wildlife.',translation:'我们应防止垃圾进入水中，因为垃圾会伤害野生动物。',explain:'建议包含做什么与为什么；should / can 后用动词原形，结尾可表达共同改善环境的期待。',
  animation:{kind:'sequence',actors:['志愿者','居民'],labels:['河中垃圾：问题','收集分类：行动','保护生物：理由']},rows:[
   ['哪项属于具体的湿地保护建议？','Keep rubbish out of the water.|Nature is beautiful.|I like holidays.','第一项明确告诉读者做什么。'],
   ['We should ___ the river clean.','keep|to keep|keeping','情态动词 should 后用原形。'],
   ['We can ___ signs near the path.','put up|puts up|putting up','can 后接动词原形 put up。'],
   ['建议中 because 后面通常补充？','行动的理由|收信人的名字|信的字体','because 引出原因，使建议有根据。'],
   ['“There is rubbish near the lake.”在建议信中主要属于？','问题描述|结束祝愿|已经完成的全部解决方案','这句指出现状，尚未提出行动。'],
   ['哪句适合作为期待改进的结尾？','I hope we can make the wetland cleaner together.|My new shoes are blue.|The date has four numbers.','结尾回应共同改善环境的主题。'],
   ['前文说“游客大声说话惊扰鸟类”，最对应的建议是？','Walk quietly and speak softly near birds.|Buy a bigger school bag.|Only count the trees.','降低噪声直接针对惊扰问题。'],
   ['“We should do something good.”需要如何改善？','补充具体行动及其作用|重复good十次|删去环境问题只写问候','具体行动和理由能让建议真正可实行。'],
   ['“为了保护湿地，把所有生物都搬走”作为建议有什么问题？','破坏生态系统，行动与保护目标相矛盾|只因用了所有这个词就一定语法错|只要写了protect就一定合理','行动需符合保护目的，不能只看口号。'],
   ['哪段建议信有完整逻辑？','Some visitors leave rubbish by the lake. We should add bins and remind people to use them because rubbish can harm wildlife.|The lake is beautiful. My desk is brown. Goodbye.|We should throw more rubbish into the lake because we want it clean.','第一段指出问题、给出可行措施、解释保护理由。']
  ]
 });
 window.GrowingEnglishPointCourses.define('english-8a-07',{lessons});
})();
