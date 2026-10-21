/* 教材主题与语法范围：2025秋译林版八上。讲解、例句、检测题为本项目编写。 */
(() => {
  'use strict';
  const q=(prompt,choices,explain)=>({prompt,options:choices.split('|'),answer:choices.split('|')[0],explain});
  const l=(id,title,pages,points,example,questions)=>({id,title,pages,points,example,questions});
  window.GrowingEnglishLessons={
    1:[
      l('reading','阅读：用事例写出朋友的品质','8–11',[
        'My best friend 用外貌、品质和具体事例介绍朋友。Betty 乐于助人、耐心倾听；Max 幽默、精力充沛，并鼓励朋友坚持。',
        '不要只堆形容词：先说品质，再给证据。help sb with sth 帮某人做某事；make sb laugh 使某人发笑。',
        '写作顺序：人物与外貌 → 品质及事例 → 对友谊的感受。下列例句为原创。'
      ],'My friend is patient. She listens to me when I feel worried.（我的朋友很有耐心。担心时，她会听我倾诉。）',[
        q('哪项最能作为“乐于助人”的证据？','She helps me with my schoolwork.|She has long hair.|She is tall.','帮助别人完成学业能体现乐于助人，外貌不能证明品质。'),
        q('He often tells jokes and makes us ___.','laugh|to laugh|laughing','make sb do sth：主动语态中用不带to的不定式。'),
        q('介绍好朋友，较合理的段落顺序是？','外貌→品质及事例→感受|感受→无关新闻→姓名|只列身高和年龄','品质需要事例支持，结尾表达友谊的意义。')]),
      l('forms','语法：形容词比较级与最高级的构成','12–13',[
        '多数短形容词加-er/-est：tall→taller→tallest；以e结尾加-r/-st：nice→nicer→nicest。',
        '辅音字母+y结尾：happy→happier→happiest；重读闭音节末尾为单个辅音字母时常双写：big→bigger→biggest。',
        '多音节通常用more/most：more careful。特殊变化：good/well→better→best；bad/ill→worse→worst。不要叠加more和-er。'
      ],'This box is bigger, but that one is the biggest.（这个盒子更大，但那个最大。）',[
        q('happy 的比较级是？','happier|happyer|more happier','辅音字母+y结尾，变y为i再加-er。'),
        q('big 的最高级是？','biggest|bigest|most bigger','双写g后加-est。'),
        q('Which is ___, this book or that one?（更有趣）','more interesting|interestinger|most interesting','两者比较用比较级，多音节用more。')]),
      l('comparison','语法：比较范围和句型','12–13',[
        'A + be + 比较级 + than + B 比较两者。用much/a little等修饰比较级，不能用very直接修饰比较级。',
        '在某个范围内比较三者或以上，用the + 最高级，常配in our class或of the three。',
        'one of the + 最高级 + 复数名词表示“最……之一”；同类相比，避免把人的头发与人直接比较。'
      ],'Her hair is longer than mine. She is one of the kindest students.（她的头发比我的长。她是最善良的学生之一。）',[
        q('Of the three boys, Ben is ___.','the tallest|taller|tall','三人范围中用最高级，通常加the。'),
        q('This bag is ___ heavier than that one.','much|very|most','much可以修饰比较级；very不可以直接修饰比较级。'),
        q('She is one of the most helpful ___.','students|student|a student','one of后接复数名词。')]),
      l('suffixes','词汇运用：-ful / -less 与人物描写','14–18',[
        '-ful常表示“充满……的”：careful细心的、helpful有帮助的；-less常表示“缺少……的”：careless粗心的、hopeless无望的。',
        'bored描述人的感受，boring描述令人厌烦的人或事物：I feel bored because the film is boring。',
        'be ready to do sth 乐意做某事；keep secrets 保密；get along with sb 与某人和睦相处。'
      ],'A helpful friend keeps my secrets and encourages me.（乐于助人的朋友替我保密并鼓励我。）',[
        q('care 加哪个后缀可以表示“粗心的”？','-less|-ful|-er','careless表示粗心的，careful表示细心的。'),
        q('The long film is ___, and I feel bored.','boring|bored|bore','事物令人厌烦用boring；人的感受用bored。'),
        q('She is always ready ___ others.','to help|helping|help','be ready to do sth。')])
    ],
    2:[
      l('reading','阅读：比较不同的校园生活','22–25',[
        'My school life 以博客形式介绍不同学校的生活。阅读时按学校规模、课程、活动及学生感受整理信息。',
        'Nancy的学校较小、学生较少，开设戏剧和外语等课程，也重视艺术。注意通过事实比较学校，不能只凭个人喜好下结论。',
        'look forward to后接名词或动名词；offer sb sth = offer sth to sb；pay attention to后也可接动名词。'
      ],'I look forward to joining the drama club. Our school offers us many activities.（我期待加入戏剧社。学校为我们提供许多活动。）',[
        q('I look forward to ___ Chinese.','learning|learn|learns','to在look forward to中是介词，后接动名词。'),
        q('比较两所学校时，哪项提供可比较的事实？','One has smaller classes than the other.|My school is simply perfect.|I like my school very much.','班级规模是可比较的信息；喜欢与否是主观感受。'),
        q('The school offers many courses ___ us.','to|for|with','offer sth to sb；另一个句型是offer sb sth。')]),
      l('amount','语法：more / fewer / less','26–27',[
        '可数名词复数比较数量：more/fewer students；不可数名词比较数量：more/less time。先判断名词能否数。',
        '三者或以上比较最多最少：the most / the fewest + 可数名词复数，the most / the least + 不可数名词。',
        'few/fewer/fewest对应可数；little/less/least对应不可数；many/much的比较级都是more，最高级都是most。'
      ],'We have fewer tests and less homework this week.（本周测验次数更少，作业量也更少。）',[
        q('I have ___ books than you.（更少）','fewer|less|least','books是可数名词复数，比较级用fewer。'),
        q('Of the three, Amy spends ___ time on the trip.（最少）','the least|the fewest|less','time为不可数名词，三者中最少用the least。'),
        q('Tom has ___ water than Ben.（更多）','more|many|most','两者比较用more，water不可数，不能用many。')]),
      l('equality','语法：as ... as 的同级比较','27',[
        'as + 形容词/副词原级 + as 表示“和……一样……”，中间不用比较级。',
        'not as/so + 原级 + as 表示“不如……”。A is not as tall as B相当于A is shorter than B。',
        '相同数量：as many + 可数名词复数 + as；as much + 不可数名词 + as。'
      ],'Our library is as quiet as yours. I have as many books as you.（我们的图书馆和你们的一样安静。我的书和你一样多。）',[
        q('This subject is as ___ as that one.','important|more important|most important','as...as中间用原级。'),
        q('I do not have as ___ free time as you.','much|many|more','time不可数，相同数量用as much...as。'),
        q('A is not as tall as B，意味着？','A is shorter than B.|A is taller than B.|A is the tallest.','not as tall as表示没有……高。')]),
      l('writing','综合运用：建议、语言与学校改进','28–32',[
        '国籍/语言常见词尾：British、Italian、Japanese、American。语言、国籍和国家名称首字母通常大写。',
        'suggest doing sth 建议做某事；suggestion是可数名词，advice通常不可数：a suggestion / some advice。',
        '改进校园的短文应包含：现状事实→具体建议→预期好处。provide sb with sth = provide sth for sb。'
      ],'I suggest starting a reading club. It can help us develop good habits.（我建议开办读书社。它能帮助我们养成好习惯。）',[
        q('I suggest ___ a school garden.','creating|to create|create','suggest后接动名词。'),
        q('Which spelling is correct?','Japanese|japanese|Japaneses','Japanese首字母大写，不加-s表示日语。'),
        q('The library provides books ___ students.','for|to|at','provide sth for sb；也可说provide sb with sth。')])
    ],
    4:[
      l('reading','阅读：从动手失误到学会DIY','50–53',[
        'DIY made easy 中Andrew热爱DIY，却先后遇到停电、打中水管等问题；阅读时按时间线整理“尝试→问题→学习→进步”。',
        '他通过阅读和线上课程进步，后来制作书架和落地灯。主题是学习与实践，不是“只凭热情就不会犯错”。',
        'be crazy about 热衷于；fill...with... 使……充满；in a mess 乱七八糟。动手前读说明，危险操作请成年人协助。'
      ],'After taking a course, I learnt to make a shelf safely.（上完课程后，我学会了安全地做书架。）',[
        q('按课文，Andrew进步的重要原因是？','阅读DIY资料并参加线上课程|一直不看说明|完全不再动手','课文突出学习加实践带来的进步。'),
        q('Fill the box ___ paper.','with|of|from','fill A with B：用B装满A。'),
        q('My brother is crazy ___ making models.','about|to|with','be crazy about sth/doing sth。')]),
      l('imperatives','语法：祈使句与操作步骤','54',[
        '祈使句常省略主语you，用动词原形开头：Read the instructions。它可表达请求、命令或建议。',
        '否定祈使句：Don’t + 动词原形；Be careful的否定是Don’t be careless，不能省略be。',
        'please可放句首或句尾，使语气更礼貌；Let’s + 动词原形表示提议一起行动。用First/Next/Finally组织步骤。'
      ],'First, read the instructions. Next, mark the board. Don’t touch the sharp edge.（先读说明，再在木板上做标记。不要碰锋利的边缘。）',[
        q('___ the instructions before you start.','Read|Reads|Reading','祈使句用动词原形开头。'),
        q('不要把工具放在地上：___ the tools on the floor.','Don’t leave|Not leave|Doesn’t leave','否定祈使句用Don’t+动词原形。'),
        q('Let’s ___ a card together.','make|to make|making','Let’s后接动词原形。')]),
      l('advice','语法：should / had better','55',[
        'should + 动词原形提出建议；否定should not / shouldn’t + 动词原形。第三人称后也不加-s。',
        'had better + 动词原形表示“最好……”，常带有较强提醒；这里的had不表示过去时。',
        'had better的否定：had better not + 动词原形。不能写had not better或had better to do。'
      ],'You should follow the instructions. You had better not work alone.（你应当遵循说明，最好不要独自操作。）',[
        q('She should ___ an adult for help.','ask|asks|to ask','情态动词should后接动词原形。'),
        q('You had better ___ the power first.','turn off|to turn off|turning off','had better后接动词原形。'),
        q('“最好不要跑”的正确表达是？','You had better not run.|You had not better run.|You had better don’t run.','否定结构had better not do。')]),
      l('prefixes','综合运用：否定前缀与手作介绍','56–60',[
        'un-/in-/im-可构成否定意义：unhappy、incorrect、impossible。前缀选择需要随词记忆，不能随意替换。',
        'not only...but also...连接并列成分，结构尽量一致：not only saves money but also brings joy。',
        '介绍手作时交代材料、步骤、结果和感受；instead单独用作副词，instead of后接名词或动名词。'
      ],'We use old boxes instead of buying new ones. DIY not only reduces waste but also brings joy.（我们利用旧盒子，不买新盒子。DIY既减少浪费又带来乐趣。）',[
        q('possible的反义词是？','impossible|unpossible|inpossible','固定构词impossible。'),
        q('We make gifts instead of ___ them.','buying|buy|to buy','instead of中的of为介词，后接动名词。'),
        q('DIY not only saves money ___ brings joy.','but also|and but|or also','not only...but also...固定并列结构。')])
    ],
    5:[
      l('reading','阅读：熊猫成长、困境与保护','66–69',[
        'Protecting pandas 从饲养员视角写希望（Xiwang）的成长，再介绍野生大熊猫面临的困难及保护行动。',
        '按“成长时间线”和“问题→措施→变化”两条线整理：幼崽脆弱、竹林减少；法律、保护区与科研帮助保护熊猫。',
        'live on 以吃……为生；as a result 因此；thanks to 多亏；take action 采取行动。注意不能把饲养个体的情况直接当作所有野生个体的情况。'
      ],'Pandas live mainly on bamboo. We should take action to protect their homes.（熊猫主要以竹子为食。我们应采取行动保护它们的家园。）',[
        q('按课文，熊猫主要以什么为食？','Bamboo.|Fish.|Meat.','课文说明熊猫主要以竹子为食。'),
        q('哪项属于保护措施？','Setting up nature reserves.|Making bamboo forests smaller.|Hunting wild animals.','建立自然保护区属于保护措施。'),
        q('Thanks ___ their efforts, things are getting better.','to|for|with','thanks to表示“多亏，由于”；thanks for用于感谢某事。')]),
      l('verb-to','语法：动词 + to不定式','70',[
        '动词不定式常由to + 动词原形构成，可放在一些动词后作宾语：hope/decide/plan/agree/learn to do。',
        '否定形式是not to do：decide not to hunt。这里的to是不定式标记，不能按介词后接-ing处理。',
        '不同动词搭配不同：enjoy doing、finish doing；不能把所有动词都套成to do。'
      ],'We decided to visit the reserve. We enjoy watching birds.（我们决定去保护区，喜欢观鸟。）',[
        q('They plan ___ wild animals.','to protect|protecting|protects','plan后可接to do作宾语。'),
        q('We decided ___ the animals.（不伤害）','not to hurt|to not hurting|don’t hurt','否定不定式not to do。'),
        q('She enjoys ___ photos of birds.','taking|to take|take','enjoy后接动名词，不是to不定式。')]),
      l('purpose','语法：用to不定式表达目的','70–71',[
        'to do可表示“为了做……”，回答why，与前面动作的目的相联系：We went there to watch birds。',
        '目的不定式可在句末，也可放句首：To protect animals, we build reserves。句首较长状语后常用逗号。',
        '区别“做了什么”和“为什么做”：We read books to learn about wolves中read books是动作，to learn...是目的。'
      ],'We put up a poster to tell people about wildlife.（我们张贴海报，让人们了解野生动物。）',[
        q('We went to the forest ___ birds.（为了观察）','to watch|watched|watching','to watch在这里作目的状语。'),
        q('“She works hard to help animals.”中to help animals回答哪个问题？','Why does she work hard?|When does she work?|Who is she?','目的不定式回答“为什么”。'),
        q('___ more about pandas, we read this book.','To learn|Learned|Learning to','句首用To learn表达读书的目的。')]),
      l('object-to','语法：宾语后带to和不带to的不定式','71',[
        'ask/tell/want/invite sb to do sth：不定式补充说明宾语要做什么。否定：ask sb not to do。',
        '主动语态中make/let sb do sth，省略to。help sb (to) do sth中to可以保留或省略。',
        'see/hear sb do sth强调看见/听见整个过程或经常发生的动作；see/hear sb doing sth强调正在发生的动作。'
      ],'The keeper asked us not to feed the animals. His story made us think.（饲养员请我们不要喂动物。他的故事引发了我们的思考。）',[
        q('The teacher asked us ___ quietly.','to wait|wait|waiting','ask sb to do sth。'),
        q('The funny animal made us ___.','laugh|to laugh|laughed','主动语态make sb do sth省略to。'),
        q('They told us ___ the birds.（不要打扰）','not to disturb|don’t disturb|not disturbing','tell sb not to do sth。')]),
      l('writing','综合运用：保护倡议与构词','72–76',[
        '-ness常把形容词变为名词，如kind→kindness；-ion常见于action、protection；-ing可构成satisfying等形容词。词形应随词记忆。',
        'danger是名词，dangerous是形容词；in danger中的danger与at risk中的risk都是名词。',
        '保护倡议按“动物特征→面临危险→可以采取的行动”组织。用具体行动，如保护栖息地、减少污染，而不是空泛口号。'
      ],'Wild animals are in danger. Let’s protect their homes and reduce pollution.（野生动物处于危险中。让我们保护它们的家园、减少污染。）',[
        q('kind变成表示“善良”的名词是？','kindness|kindly|kinding','kind+-ness→kindness。'),
        q('Some animals are in ___.','danger|dangerous|dangerously','介词in后这里需要名词danger。'),
        q('哪项适合作为保护倡议中的具体行动？','Reduce pollution in rivers.|Animals are interesting.|I like animals.','减少河流污染是可落实的保护行动。')])
    ],
    6:[
      l('reading','阅读：四季诗歌中的意象','80–83',[
        'A poem about seasons 用冬雪、春风与花、夏日树荫、秋叶和收获等意象表现季节变化。先找景物和动作，再概括季节特点。',
        '诗歌可用拟人和押韵：把树与花写成“忘记生长”；snow/grow等尾音有呼应。注意诗歌语言与字面事实的区别。',
        '描述季节可按天气→景物→活动→感受组织。本文下方例句为原创，并非教材诗句。'
      ],'In autumn, leaves turn brown and farmers harvest crops.（秋天树叶变棕，农民收割庄稼。）',[
        q('“trees and flowers forget to grow”主要用了什么手法？','拟人|科学定义|数据统计','把植物写成会“忘记”的人，用拟人突出冬日景象。'),
        q('哪组词的结尾发音押韵？','snow / grow|snow / rain|grow / bird','snow与grow尾音相同。'),
        q('按诗歌描绘，收割庄稼对应哪个季节？','Autumn.|Winter.|Spring.','诗歌把收获描绘为秋季的意象。')]),
      l('sv-svo','语法：主谓与主谓宾','84–85',[
        'S代表主语，V代表谓语动词，O代表宾语。S+V：The sun shines；S+V+O：Children make snowmen。',
        '不及物动词可构成主谓结构，不直接接宾语；及物动词后通常需要宾语，说明动作作用于谁或什么。',
        '时间、地点等状语不等于宾语：Birds fly in the sky中in the sky是地点状语，核心仍是S+V。'
      ],'The wind blows. Children fly kites in the park.（风吹着。孩子们在公园放风筝。）',[
        q('“The sun shines.”的核心结构是？','S+V|S+V+O|S+V+P','The sun是主语，shines是不及物动词。'),
        q('“We build snowmen.”中宾语是？','snowmen|We|build','snowmen是build所作用的对象。'),
        q('“Birds fly in the sky.”中的in the sky是？','地点状语|直接宾语|主语','地点介词短语在此作状语，不是宾语。')]),
      l('linking','语法：主系表与感官动词','84–85',[
        'S+V+P中P为表语，说明主语的身份、状态或性质；系动词连接主语和表语。',
        '常见系动词：be、become、get、turn、seem、look、sound、smell、taste、feel。作系动词时常接形容词：feel cold。',
        '同一词在不同句中作用可不同：The flower smells sweet中smells为系动词；He smells the flower中smells为实义动词。'
      ],'The soup tastes nice. The leaves turn yellow.（汤尝起来很好。树叶变黄。）',[
        q('The flowers smell ___.','sweet|sweetly|sweetness','smell在此为系动词，后接形容词sweet。'),
        q('“The sky becomes dark.”的结构是？','S+V+P|S+V+O|S+V','dark描述主语状态，是表语。'),
        q('哪句的smell是“闻起来”的系动词？','The soup smells good.|He smells the soup.|She smells a flower.','第一句说明汤的气味，good是表语。')]),
      l('weather','综合运用：天气构词与季节介绍','86–90',[
        '天气名词加-y常变为形容词：rain→rainy、snow→snowy、cloud→cloudy；fog→foggy、sun→sunny需要双写。',
        '描述温度可用degrees、below/above zero；问天气用What is the weather like?，不用How is the weather like?。',
        '季节介绍应说明所在地与时段，避免把某地气候说成全球规律。用because说明你喜欢该季节的原因。'
      ],'It is sunny today. The temperature is five degrees below zero.（今天晴朗。气温是零下五度。）',[
        q('fog对应的天气形容词是？','foggy|fogy|fogful','fog→foggy，双写g再加-y。'),
        q('询问天气，哪句正确？','What is the weather like?|How is the weather like?|What does the weather like?','固定问法What is the weather like?；也可说How is the weather?。'),
        q('five degrees below zero表示？','零下五度|零上五度|五十度','below zero表示零度以下。')])
    ],
    7:[
      l('reading','阅读：生态系统的成员与作用','94–97',[
        'The earth’s main ecosystems 介绍海洋、湿地、森林。生态系统包括区域内的生物与非生物成分，不只是动物。',
        '教材把海洋、湿地、森林分别比作地球的心脏、肾脏、肺，帮助理解水循环、净水蓄水、净化空气等功能。比喻不等于真正的人体器官。',
        '按“类型→组成→功能→保护意义”整理信息；get rid of 清除，lead to 导致，keep a balance 保持平衡。'
      ],'Wetlands store water and help clean it. Forests provide homes for wildlife.（湿地蓄水并有助于净水。森林为野生动物提供家园。）',[
        q('生态系统包括哪些成分？','Living and non-living things.|Only animals.|Only trees.','生态系统也包括水、空气、土壤等非生物成分。'),
        q('教材把湿地比作地球的什么器官？','Kidneys.|Lungs.|Eyes.','湿地的净水功能被比作肾脏。'),
        q('Water pollution can lead ___ serious problems.','to|with|for','lead to表示“导致”。')]),
      l('double-object','语法：主谓双宾语','98',[
        'S+V+IO+DO：主语+谓语+间接宾语+直接宾语。间接宾语常指人，直接宾语常指物：She gave me a book。',
        '调整顺序：give/show/send/teach sb sth常可改为give/show/send/teach sth to sb。',
        'buy/make/cook sb sth常可改为buy/make/cook sth for sb。to/for由动词搭配决定，不可随便替换。'
      ],'I showed my friend a photo. = I showed a photo to my friend.（我给朋友看了一张照片。）',[
        q('“She gave me a book.”中me是什么？','间接宾语|直接宾语|表语','me指接受书的人，是间接宾语；a book是直接宾语。'),
        q('He showed the map ___ us.','to|for|with','show sth to sb。'),
        q('Mum bought a coat ___ me.','for|to|at','buy sth for sb。')]),
      l('complement','语法：主谓宾与宾语补足语','98',[
        'S+V+O+C中C为宾语补足语，补充说明宾语的状态、身份或动作：We keep the river clean。',
        '双宾语是“给谁什么”，宾补则与宾语有描述关系：We call him Tom中Tom是his name，不是给他的东西。',
        '宾补可由形容词、名词、不定式、分词等充当；本课先辨析句子结构，动词后的具体形式仍须遵守搭配。'
      ],'The news made us happy. We call the bird Snowy.（消息使我们高兴。我们把这只鸟叫作Snowy。）',[
        q('“We keep the water clean.”中clean是？','宾语补足语|直接宾语|主语','clean补充说明water的状态。'),
        q('哪句为双宾语结构？','She gave me a pen.|She made me happy.|We call him Ben.','gave后me和a pen是两个宾语；其余句中happy、Ben是宾补。'),
        q('“They found the room empty.”的核心结构是？','S+V+O+C|S+V+IO+DO|S+V+P','empty说明宾语the room的状态。')]),
      l('conjunctions','语法：and / but / or / so','99',[
        'and表示并列、添加；but表示转折；or表示选择；so表示结果。先理解逻辑，再选连词。',
        'because与so不在同一组主从句中重复使用：Because it rained, we stayed home；It rained, so we stayed home。',
        '否定句中连接并列对象常用or：I cannot speak French or German。祈使句+or可表示“否则”。'
      ],'The task is hard, but we will try. It is raining, so we stay inside.（任务很难，但我们会尝试。因为下雨，我们留在室内。）',[
        q('The room is small ___ comfortable.','but|so|or','small与comfortable形成转折关系。'),
        q('It was cold, ___ we closed the window.','so|because|but','后半句是前半句的结果，用so。'),
        q('Which sentence is correct?','Because it rained, we stayed home.|Because it rained, so we stayed home.|It rained because so we stayed home.','because和so不要在同一组句中重复连接。')]),
      l('writing','综合运用：-ly与环保建议','100–104',[
        '许多形容词加-ly构成副词：quiet→quietly、careful→carefully；happy→happily。形容词修饰名词，副词常修饰动作。',
        '并非所有-ly结尾词都是副词，例如friendly是形容词；good的副词是well，不能写goodly表示“做得好”。',
        '环保建议信应明确问题、行动和理由。用should、can等提出可实行的建议，结尾表达期待。'
      ],'Please walk quietly and keep the wetland clean.（请安静行走，保持湿地清洁。）',[
        q('Please listen ___.','carefully|careful|carefulness','修饰listen的方式用副词carefully。'),
        q('She is ___ to her neighbours.','friendly|friendlily|friend','friendly是形容词，在此作表语。'),
        q('哪项建议更具体且与湿地保护有关？','Keep rubbish out of the water.|Nature is beautiful.|I enjoy holidays.','不要向水中丢垃圾是可操作的保护建议。')])
    ],
    8:[
      l('reading','阅读：地震叙事的时间线与情绪变化','108–111',[
        'The Highfield earthquake 是Timmy的幸存经历。按“地震开始→建筑倒塌与被困→保持镇静→等待救援→获救”整理事件。',
        '叙述使用声音、动作、环境和心理活动：从恐惧紧张到冷静求助。at first / then / finally帮助追踪顺序。',
        '课文中的人物行为是故事情节，不应直接当作通用逃生指令。实际遇险遵循当地专业人员的指引。'
      ],'He felt nervous, but he tried to calm down and wait for help.（他很紧张，但努力镇静下来等待援助。）',[
        q('Timmy被困后，为保存体力而做了什么？','Waited for help.|Kept running in the street.|Played a game.','课文写到他意识到要保存体力、等待救援。'),
        q('At first / then / finally主要帮助读者了解什么？','事件发生顺序|人物身高|单词字母顺序','这些词标明叙事时间线。'),
        q('Try to calm ___.','down|up|off','calm down表示平静、镇静下来。')]),
      l('past-continuous','语法：过去进行时','112–113',[
        '过去进行时表示过去某时刻或某阶段正在进行的动作：was/were + 动词-ing。I/he/she/it用was；you/we/they用were。',
        '否定在was/were后加not；一般疑问句把was/were提前。不能用did来代替这一结构中的be。',
        '常见语境：at eight last night、at this time yesterday。状态动词know等通常不用进行时；过去发生并结束的整体事件可用一般过去时。'
      ],'At eight last night, I was reading and my parents were cooking.（昨晚八点，我在看书，父母在做饭。）',[
        q('At this time yesterday, she ___ a book.','was reading|were reading|reads','she配was；过去某时正在做用was reading。'),
        q('They ___ football at five yesterday afternoon.','were playing|was playing|play','they配were playing。'),
        q('“He was sleeping.”的一般疑问句是？','Was he sleeping?|Did he sleeping?|Was sleeping he?','把was提前，其他顺序保持。')]),
      l('when-while','语法：when / while / as','112–113；164–165',[
        '过去长动作作背景，短动作突然发生：I was reading when the phone rang。长动作常用过去进行时，短动作用一般过去时。',
        'while引导的时间从句通常使用延续性动作；两个过去长动作同时发生，常用was/were doing ... while ... was/were doing。',
        'when既可连接瞬间动作也可连接延续动作；as也可表示“随着”或“一边……一边……”。不能只按看到某个连词就机械选时态。'
      ],'While I was doing homework, my sister was drawing. I was reading when the phone rang.（我做作业时，妹妹在画画。我看书时电话响了。）',[
        q('I was walking home when it suddenly ___ to rain.','began|was begin|beginning','短动作began用一般过去时；主句为长动作。'),
        q('While Mum was cooking, Dad ___ the dishes.（当时也正在洗）','was washing|washed every day|washes','两个过去同时进行的长动作用过去进行时。'),
        q('哪句的while用法正确？','While I was waiting, a bus arrived.|While he arrived, I was reading.|While the bell rang once, she left.','while从句通常要用延续性动作，如was waiting。')]),
      l('writing','综合运用：构词与安全主题叙事','114–118',[
        '复合词可由两个词构成：snow+storm→snowstorm，air+port→airport；它们的词性、拼写仍应按词表记忆。',
        'avoid doing sth 避免做某事；warn sb not to do sth 警告某人不要做某事；put out 扑灭。',
        '事故或安全主题短文交代时间、地点、发生经过、援助及结果。区分背景中的进行动作与先后完成的动作。'
      ],'The teacher warned us not to play on the road. We should avoid running in heavy traffic.（老师警告我们不要在马路上玩耍。我们应避免在车流中奔跑。）',[
        q('snow + storm构成哪个词？','snowstorm|snowstorming|stormsnow','snowstorm表示暴风雪。'),
        q('We should avoid ___ on the road.','playing|to play|play','avoid后接动名词。'),
        q('The sign warns us ___ here.（不要游泳）','not to swim|don’t swim|not swimming','warn sb not to do sth。')])
    ]
  };
})();
