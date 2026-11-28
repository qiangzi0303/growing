/* Original teaching examples. Square brackets mark the words to observe, not blanks to answer. */
(()=>{
 'use strict';
 const S=(before,beforeZh,after,afterZh,note)=>({type:'sentence',before,beforeZh,after,afterZh,note});
 const E=(prompt,conclusion,lines,visual)=>({type:'evidence',prompt,conclusion,visual,lines:lines.map(([text,translation,reason,relevant=true])=>({text,translation,reason,relevant}))});
 const units={
  1:{
   'reading.evidence':E('哪种行为能支持“Mia is patient”？点击句子找依据。','Mia is patient. 她愿意等对方说完、不打断，这些行为支持“有耐心”。',[
    ['Tom speaks slowly when he feels worried.','汤姆担心时，说话很慢。','这是情境背景，还没有写米娅的行为。',false],
    ['Mia waits until he finishes and never interrupts.','米娅等他说完，从不打断。','等待、不打断：与“耐心倾听”直接相关。'],
    ['Mia has long brown hair.','米娅有一头棕色长发。','这是外貌，不能用来判断是否有耐心。',false]],'patient-listening'),
   'reading.portrait':E('点击每句话，看看一段朋友介绍怎样展开。','人物 → 品质与事例 → 友谊感受。每句话承担不同作用。',[
    ['My best friend is Amy. She has short hair.','我最好的朋友是埃米。她留着短发。','开头交代人物，用外貌帮助读者认识她。'],
    ['She helps me with English and makes me laugh.','她帮助我学习英语，也逗我开心。','用具体行为支持“乐于助人、有幽默感”。'],
    ['I am lucky to have such a friend.','有这样的朋友，我很幸运。','结尾表达友谊带给自己的感受。']]),
   'forms.regular':S('[tall] · [nice]','高的 · 好的','[taller / tallest] · [nicer / nicest]','更高／最高 · 更好／最好','tall 加 -er / -est；nice 已有 e，只加 -r / -st。放入句子：This tree is taller than that one.'),
   'forms.spelling':S('happ[y] · bi[g] · long','开心的 · 大的 · 长的','happ[ier] / happ[iest] · bi[gger] / bi[ggest] · long[er] / long[est]','比较级／最高级的拼写变化','happy 变 y 为 i；big 双写 g；long 末尾已有两个辅音字母，不双写 g。'),
   'forms.irregular':S('[good] · [bad] · careful','好的 · 差的 · 细心的','[better / best] · [worse / worst] · [more / most] careful','不规则变化与 more / most','good、bad 整个词变化；careful 前加 more / most。不能把两种方法叠加成 more better。'),
   'comparison.than':S('Her hair is [long].','她的头发很长。','Her hair is [much longer than] mine.','她的头发比我的长得多。','加入比较对象后用 longer than；much 修饰比较级，说明差距大。mine 指 my hair。'),
   'comparison.range':S('She is a [kind student].','她是一名善良的学生。','She is [one of the kindest students in our class].','她是我们班最善良的学生之一。','in our class 给出范围；one of 表示其中之一，所以 students 用复数。'),
   'suffixes.word-feelings':S('The story is [boring].','这个故事令人无聊。','I feel [bored] with the story.','我觉得这个故事很无聊。','boring 说明引起感受的事物；bored 说明人的感受。careful / careless 则分别表示细心／粗心。'),
   'suffixes.friend-phrases':S('She is [ready]. She [helps] her classmates.','她准备好了。她帮助同学。','She is [ready to help] her classmates and [gets along with] them.','她乐于帮助同学，并与他们相处融洽。','ready 后用 to do；get along with 后接相处的对象。keep secrets 表示保守秘密。')
  },
  2:{
   'reading.school-facts':E('哪些是可以核对的事实？哪一句是个人评价？','人数与活动属于事实；“最棒”是个人评价，不能替代比较依据。',[
    ['School A has 400 students. School B has 600.','A 校有 400 名学生，B 校有 600 名。','人数可核对：A 校的学生比 B 校少。'],
    ['School A offers a music club and a science club.','A 校开设了音乐社团和科学社团。','活动种类是可核对的具体信息。'],
    ['School A is the best school in the world!','A 校是世界上最棒的学校！','这是评价；两条事实不足以证明“世界上最棒”。',false]]),
   'reading.school-phrases':S('I want [to join] the club.','我想参加这个社团。','I look forward to [joining] the club.','我期待参加这个社团。','look forward to 中的 to 是介词，后接 joining；want 后的 to 则与动词原形构成不定式。'),
   'amount.more-less-fewer':S('We have [many tests] and [much homework].','我们有很多测验和作业。','This week, we have [fewer tests] and [less homework].','这周，我们的测验和作业都少了一些。','tests 是可数名词复数，少用 fewer；homework 不可数，少用 less。更多都可用 more。'),
   'amount.most-least':S('Amy: 2 books, ¥10. Ben: 4 books, ¥20. Lily: 6 books, ¥30.','三个人的书本数与花费。','Amy has [the fewest books] and spends [the least money].','埃米的书最少，花的钱也最少。','先确定三人范围，再区分可数的 books 和不可数的 money；最高级前有 the。'),
   'equality.as-original':S('Our library is [quiet]. Your library is [quiet], too.','两座图书馆都很安静。','Our library is [as quiet as] yours.','我们的图书馆和你们的一样安静。','第二句明确比较安静程度相同；as…as 中间仍用原级 quiet。第一句只说两处都安静，并未明确程度相等。'),
   'equality.many-much':S('You have five books. I also have five books.','你有五本书，我也有五本。','I have [as many books as] you.','我的书和你的一样多。','可数复数 books 用 many；换成不可数的 free time，就说 as much free time as。'),
   'writing.nationality-advice':S('I [suggest] a reading activity.','我建议开展一项阅读活动。','I [suggest reading Japanese] stories. Here is some [advice].','我建议读日语故事。这里有一些建议。','suggest 后接 doing；Japanese 首字母大写；advice 不可数，不写 an advice。'),
   'writing.improvement':E('点击句子，检查建议是否回应了实际问题。','问题 → 可实施的建议 → 预期好处；好处是预期，不冒充已经发生的事实。',[
    ['Our library gets noisy at lunchtime.','午饭时间，我们的图书馆很吵。','说明现状，为建议提供理由。'],
    ['I suggest adding a quiet reading area.','我建议增加一个安静阅读区。','提出针对噪声问题的具体做法。'],
    ['This could help students read without interruptions.','这可能帮助学生不受打扰地阅读。','could 表示预期好处，而非已经验证的结果。']])
  },
  3:{
   'patterns.purpose-method':S('I improve my English [by reading aloud].','我通过朗读提高英语。','I read aloud [in order to speak more clearly].','我朗读是为了说得更清楚。','by doing 回答“用什么方法”；in order to do 回答“为了什么目的”。'),
   'patterns.time-prepositions':S('I spend ten minutes [on English practice].','我花十分钟练习英语。','I spend ten minutes [practising English].','我花十分钟练习英语。','spend time on sth / doing；其他介词后也用名词或 doing，如 focus on learning。'),
   'patterns.degree-range':S('Read [carefully]. Amy is a [good learner].','仔细阅读。埃米是个好学者。','Read [as carefully as possible]. Amy is [one of the best learners].','尽可能仔细阅读。埃米是最优秀的学习者之一。','as…as possible 中保留 carefully 原级；one of 后用最高级及复数 learners。'),
   'patterns.useful-patterns':S('[Why not write] the sentence down?','为什么不把这个句子记下来呢？','[How about writing] it down?','把它记下来怎么样？','Why not 后用原形；How about 后用 doing。代词 it 放在 write 与 down 中间。'),
   'adverbs.form-function':S('Amy is a [careful] reader.','埃米是个细心的读者。','Amy reads [more carefully] than before.','埃米比以前读得更仔细了。','careful 描述名词 reader；carefully 修饰 reads，比较时前加 more。'),
   'adverbs.irregular-degree':S('She speaks English [well].','她英语说得好。','She speaks English [much better] now.','她现在英语说得好多了。','well 的比较级是 better，much 表示差距；不写 more better。badly → worse → worst。'),
   'adverbs.comparison-range':S('Tom runs [as fast as] Jack.','汤姆和杰克跑得一样快。','Amy runs [faster than] both of them. She runs [the fastest of the three].','埃米比他们两人都快。她在三人中跑得最快。','相同用原级，两者比较用 faster；确定三人范围后用 fastest。'),
   'reflexives.self-reference':S('[My brother] taught [me] English.','我哥哥教我英语。','[I] taught [myself] English.','我自学英语。','第一句的教者和学习者是两个人；第二句是同一个人，因此 me 变为 myself。'),
   'reflexives.self-phrases':S('She finished the task [with help].','她在帮助下完成了任务。','She finished the task [by herself].','她独立完成了任务。','by herself 表示独立完成；She herself finished it 中 herself 强调是她亲自完成。'),
   'formation.people-suffixes':S('[learn] · [invent] · [write] · [win]','学习 · 发明 · 写作 · 获胜','[learner] · [inventor] · [writer] · [winner]','学习者 · 发明家 · 作家 · 获胜者','表示人的后缀要随词记：-er / -or；write 加 r；win 双写 n 后加 er。'),
   'formation.word-chains':S('The inventor was [successful].','这位发明家是成功的。','The inventor finished the invention [successfully].','这位发明家成功地完成了发明。','successful 在系动词后说明人的状态；successfully 修饰 finished。success 是名词。'),
   'formation.past-plurals':S('They [find] friends and [found] clubs.','他们结交朋友并创建社团。','Last year, they [found] friends and [founded] a club.','去年，他们结交了朋友并创建了一个社团。','find 的过去式是 found；“创建”本来就是 found，过去式是 founded。不能只看同一拼写就认定同一用法。'),
   'reading.evidence-methods':E('哪句话能说明他坚持学习？','反复尝试、主动求助支持“坚持学习”，一次困难不能证明“没有天赋”。',[
    ['He found pronunciation difficult at first.','起初，他觉得发音很难。','这是困难背景，不能据此判断他是否坚持。',false],
    ['He practised every day and asked for help after mistakes.','他每天练习，出错后主动寻求帮助。','持续练习和出错后继续行动是坚持的证据。'],
    ['He wore a blue coat to class.','他穿着一件蓝色外套去上课。','衣着与学习品质没有直接联系。',false]]),
   'reading.experience-writing':E('点击句子，沿着时间线读一次学习经历。','困难 → 具体行动 → 进步；过去经历使用过去时，并用时间信息连接。',[
    ['At first, I could not speak clearly.','起初，我说得不清楚。','先交代遇到的困难。'],
    ['I practised speaking every day for two months.','我连续两个月每天练习口语。','写清具体做法和坚持时间。'],
    ['Later, I could explain my ideas more clearly.','后来，我能更清楚地表达想法。','用实际变化说明进步，而非只说“我变好了”。']])
  },
  4:{
   'reading.learn-from-errors':E('Andrew 的进步有哪些前后证据？','遇到问题 → 学习方法 → 再次尝试。改进有行动依据。',[
    ['Andrew first put up a shelf, but it fell down.','安德鲁第一次装了一个架子，但它掉了下来。','第一次尝试出现问题。'],
    ['He took a course and learnt to use the tools safely.','他参加课程，学习了安全使用工具的方法。','这是改变做法的具体行动。'],
    ['He tried again and made a stronger shelf.','他再次尝试，做出了更牢固的架子。','第二次结果与第一次对照，体现进步。']]),
   'reading.diy-phrases':S('He [likes making] models very much.','他很喜欢制作模型。','He [is crazy about making] models. His room is [in a mess].','他热衷于制作模型。他的房间一团乱。','about 是介词，后接 making；in a mess 表示杂乱。fill a box with tools 表示把箱子装满工具。'),
   'imperatives.commands':S('You should [read] the instructions. You should not [touch] the edge.','你应该读说明，不应该碰边缘。','[Read] the instructions. [Don’t touch] the sharp edge.','读说明。别碰锋利的边缘。','改成祈使句后省去主语，用原形开头；否定在原形前加 Don’t。'),
   'imperatives.steps':S('[Read] the instructions. [Fold] the paper.','读说明。折纸。','[First], read the instructions. [Next], mark the paper. [Finally], fold it.','先读说明，再在纸上做标记，最后折叠。','顺序词把步骤连接起来；每个祈使句仍用原形。礼貌请求可加 please。'),
   'advice.should':S('She [asks] an adult for help.','她向大人求助。','She [should ask] an adult for help. She [shouldn’t work] alone.','她应该向大人求助，不应该独自操作。','加 should 后，asks 回到原形 ask；否定用 shouldn’t + 原形。'),
   'advice.had-better':S('You [had better read] the instructions.','你最好读一下说明。','You [had better not rush].','你最好不要急于动手。','had better 后接原形；否定的 not 放在 better 后面，不放在 had 前。'),
   'prefixes.negative-prefixes':S('[happy] · [correct] · [possible]','开心的 · 正确的 · 可能的','[un]happy · [in]correct · [im]possible','不开心的 · 错误的 · 不可能的','前缀表达否定，但具体用哪个必须随词记，不能自由替换。'),
   'prefixes.diy-writing':S('We [buy new boxes]. DIY [saves money].','我们购买新箱子。DIY 节约钱。','We use old boxes [instead of buying new ones]. DIY [not only saves money but also brings joy].','我们使用旧箱子而不是购买新箱子。DIY 不仅省钱，也带来快乐。','instead of 后用 buying；not only 与 but also 两边是对应的谓语 saves / brings。')
  },
  5:{
   'reading.growth':E('点击时间信息，整理同一只熊猫的成长。','时间词把一个个体的变化连起来；这不能证明所有野生熊猫都已安全。',[
    ['At birth, the panda was very small.','刚出生时，这只熊猫很小。','at birth 定位起点，后两句继续围绕同一只熊猫展开。'],
    ['Later, it became bigger and learnt to eat bamboo.','后来，它长大了一些，学会了吃竹子。','later 把新阶段与出生时连接。'],
    ['As it grew, its needs changed.','随着成长，它的需求发生了变化。','仍然围绕同一个体的发展，不能扩大到整个种群。']]),
   'reading.habitat':E('食物与栖息地之间有什么联系？点击句子找因果。','主要食物是竹子；竹林减少会影响食物与生活空间。',[
    ['Pandas live mainly on bamboo.','熊猫主要以竹子为食。','live on 说明赖以生存的食物。'],
    ['Some bamboo forests are getting smaller.','一些竹林的面积正在缩小。','这是造成困难的原因。'],
    ['As a result, pandas may have less food and space.','因此，熊猫的食物和生活空间可能减少。','as a result 引出前面原因可能带来的结果。']]),
   'reading.protection':E('点击句子，把问题与对应措施联系起来。','措施要回应问题；thanks to 引出帮助因素，不能据此推出“全部安全”。',[
    ['Pandas need safe places to live.','熊猫需要安全的生活场所。','先指出栖息地保护的需求。'],
    ['Nature reserves can help protect their homes.','自然保护区有助于保护它们的家园。','这项措施针对栖息地需求。'],
    ['Thanks to these efforts, some habitats are better protected.','多亏这些努力，一些栖息地得到更好保护。','some 限定范围；不能改说所有熊猫都不再面临威胁。']]),
   'verb-to.plan':S('We [protect] wild animals.','我们保护野生动物。','We [plan to protect] wild animals.','我们计划保护野生动物。','plan 后的 to protect 是计划的内容，不代表保护行动已经完成。'),
   'verb-to.negative':S('We decided [to feed] the animals.','我们决定喂动物。','We decided [not to feed] the animals.','我们决定不喂动物。','not 放在 to 前，否定的是“喂动物”。We did not decide… 则是否定“作决定”。'),
   'verb-to.ing':S('We [plan to watch] birds.','我们计划观鸟。','We [enjoy watching] birds.','我们喜欢观鸟。','前面的动词从 plan 换为 enjoy，后面的结构也从 to watch 换为 watching。'),
   'purpose.action':S('We [put up a poster].','我们张贴海报。','We put up a poster [to tell people about wildlife].','我们张贴海报，为了让大家了解野生动物。','put up 回答“做什么”；to tell… 回答“为什么做”。'),
   'purpose.why':S('We build reserves. [Why?]','我们建立保护区。为什么？','We build reserves [to protect animals].','我们建立保护区，为了保护动物。','to protect 补充动作目的；这个目的本身不能证明保护目标已经实现。'),
   'purpose.front':S('We build reserves [to protect animals].','我们建立保护区来保护动物。','[To protect animals], we build reserves.','为了保护动物，我们建立保护区。','目的部分移到句首，后面用逗号；动作与目的的关系保持不变。'),
   'object-to.ask':S('The keeper asked [us] [to wait].','饲养员让我们等待。','The keeper asked [us] [not to feed the animals].','饲养员请我们不要喂动物。','先给出对象 us，再给出要求；否定不定式为 not to feed。'),
   'object-to.make':S('The boss asked [me] [to work] overtime.','老板要求我加班。','The boss made [me] [work] overtime.','老板让我加班。','动词换为主动 make 后，用 make sb do，原形 work 前没有 to；强制意味也更强。'),
   'object-to.passive':S('[The boss] made [me] [work] overtime.','老板让我加班。','[I] [was made to work] overtime.','我被要求加班。','被要求的人 me 变为主语 I；made 变为 was made；主动省去的 to 在被动结构中补回来。'),
   'object-to.help':S('We helped them [protect] the animals.','我们帮助他们保护动物。','We helped them [to protect] the animals.','我们帮助他们保护动物。','help sb do 与 help sb to do 都可用。这里加上 to，主要意思不变。'),
   'object-to.see-do':{type:'motion'},
   'object-to.see-doing':{type:'motion'},
   'writing.danger':S('The animal is [dangerous].','这种动物有危险性。','The animal is [in danger].','这只动物处于危险中。','dangerous 描述它可能造成危险；in danger 表示它自身受到威胁，两句不能互换。'),
   'writing.action':E('哪些句子让读者知道“为什么做、怎么做”？','写倡议时，让具体行动对应具体问题。',[
    ['Rubbish in the river can harm wildlife.','河里的垃圾会伤害野生动物。','先说明需要解决的问题。'],
    ['Let’s keep rubbish out of the river.','让我们不要把垃圾扔进河里。','具体行动直接回应水中垃圾问题。'],
    ['I really like animals.','我真的很喜欢动物。','表达喜爱，却没有告诉读者可以做什么。',false]]),
   'writing.forms':S('Be [kind]. [Protect] animals.','善待动物。保护动物。','Show [kindness]. Animal [protection] matters.','表达善意。动物保护很重要。','kind 是形容词，kindness 是名词；protect 是动词，protection 是名词。词形随句中作用变化。')
  },
  6:{
   'reading.images':E('哪组景物和动作更支持“秋天”？','叶色变化与收获庄稼共同支持秋天；单独出现河流不能确定季节。',[
    ['Leaves turn brown and fall to the ground.','树叶变成褐色，落到地面。','叶色变化、落叶是诗句中的秋景线索。'],
    ['Farmers are busy harvesting crops.','农民正忙着收获庄稼。','收获活动补充秋天的线索，需要与其他信息一起判断。'],
    ['A river runs past the village.','一条河流经村庄。','河流在其他季节也存在，这句独自不能确定季节。',false]]),
   'reading.poetic-language':E('点击诗句，分别观察拟人与押韵。','拟人看表达的动作；押韵听结尾声音，不能只凭字母相似。',[
    ['The trees seem to sleep in the snow.','树木仿佛在雪中睡着了。','树木被赋予人的“睡眠”动作，构成拟人。'],
    ['The stars are bright. They shine at night.','星星明亮，在夜里闪耀。','bright / night 的结尾发音相同，可以押韵。'],
    ['Love and move are written with the same ending.','love 和 move 的拼写结尾相同。','它们的结尾发音不同，因此不能只凭 -ove 判断押韵。',false]]),
   'sv-svo.subject-verb':S('[Birds] [fly].','鸟儿飞翔。','[Birds] [fly] in the sky.','鸟儿在天空中飞翔。','Birds 是主语 S，fly 是谓语 V；in the sky 说明地点，不是动作对象。'),
   'sv-svo.object':S('[Birds] [fly] in the park.','鸟儿在公园里飞翔。','[Children] [fly] [kites] in the park.','孩子们在公园里放风筝。','第二句 fly 是及物用法，kites 回答“放什么”，是宾语 O；地点仍是 in the park。'),
   'linking.predicate':S('The leaves [are green].','树叶是绿色的。','The leaves [turn yellow].','树叶变黄了。','turn 在这里是系动词，yellow 说明主语的新状态，用形容词而不是副词。'),
   'linking.sense-action':S('[He] [smells] [the flower].','他闻这朵花。','[The flower] [smells] [sweet].','这朵花闻起来很香。','第一句 smells 是主动动作，后接宾语；第二句是系动词，sweet 说明花的性质。'),
   'weather.weather-words':S('The [sun] is bright. There is [fog].','阳光明亮。有雾。','It is [sunny]. It is [foggy].','天气晴朗。天气有雾。','sun / fog 是名词；sunny / foggy 是形容词，变化时都双写末尾辅音再加 y。'),
   'weather.temperature':S('The temperature is five degrees [above zero].','气温是零上五度：+5°C。','The temperature is five degrees [below zero].','气温是零下五度：−5°C。','数字同为 five，above / below 决定在零度的哪一侧；−5°C 比 +5°C 低 10°C。'),
   'weather.season-writing':E('点击句子，检查季节介绍有没有地点、景物和理由。','地点时段 → 天气景物 → 活动与喜好理由；不把家乡天气说成全国都一样。',[
    ['In my hometown, autumn is usually cool.','在我的家乡，秋天通常凉爽。','先限定地点、季节；usually 避免绝对化。'],
    ['The leaves turn yellow near the lake.','湖边的树叶变黄了。','用具体景物充实描写。'],
    ['I like autumn because I can walk there comfortably.','我喜欢秋天，因为我可以舒适地在那里散步。','活动与天气联系起来，为喜好提供理由。']])
  },
  7:{
   'reading.members-functions':E('点击句子，分清“系统成员”与“发挥的功能”。','生态系统包含生物和非生物；器官比喻帮助理解功能，不代表它真的有人体器官。',[
    ['Wetlands include plants, animals, water and soil.','湿地包括植物、动物、水和土壤。','植物、动物是生物；水、土壤属于非生物部分。'],
    ['Wetlands store water and help clean it.','湿地储水并有助于净化水。','这句话说明功能，可以用来理解教材中的器官比喻。'],
    ['Wetlands have human organs inside them.','湿地内部有人体器官。','把比喻按字面理解了，不能由净化功能得出这个判断。',false]]),
   'reading.cause-balance':E('点击句子，沿着“变化—影响—行动”寻找联系。','用具体影响连接原因与措施；保护行动要回应失衡的原因。',[
    ['Rubbish enters the water.','垃圾进入水体。','先指出环境中发生的变化。'],
    ['Dirty water can lead to problems for fish.','脏水可能给鱼类带来问题。','lead to 把变化与可能后果连接起来。'],
    ['Keeping rubbish out helps protect the balance.','阻止垃圾进入有助于保护平衡。','行动针对污染来源，不是只写“我们喜欢自然”。']]),
   'double-object.to-transfer':S('I showed [my friend] [a photo].','我给朋友看了一张照片。','I showed [a photo] [to my friend].','我给朋友看了一张照片。','先说东西 a photo，再用 to 引出接受对象；两种语序表达同一件事。'),
   'double-object.for-benefit':S('Mum bought [me] [a coat].','妈妈给我买了一件外套。','Mum bought [a coat] [for me].','妈妈为我买了一件外套。','buy 的这组改写用 for，表示为谁购买；不能把所有双宾语都机械换成 to。'),
   'complement.object-description':S('We keep [the river] [clean].','我们让河流保持清洁。','We call [the bird] [Snowy].','我们把这只鸟叫作 Snowy。','clean 描述 river 的状态，Snowy 说明 bird 的名字；它们都补充说明宾语。'),
   'complement.two-objects-or-complement':S('She made [me] [a card].','她给我做了一张卡片。','She made [me] [happy].','她使我开心。','a card 是做出的东西，与 me 构成双宾语；happy 是 me 的状态，属于宾语补足语。'),
   'conjunctions.logic-links':S('The task is hard. We will try.','任务很难。我们会尝试。','The task is hard, [but] we will try.','任务很难，但我们会尝试。','but 标明转折；and 添加，or 选择，so 结果。连接词来自两句之间的逻辑关系。'),
   'conjunctions.negative-warning':S('[Because] it rained, we stayed home.','因为下雨，我们待在家里。','It rained, [so] we stayed home.','下雨了，所以我们待在家里。','同一因果关系可以换一种结构表达，不在同一个句子里同时用 because 和 so。'),
   'writing.adverb-forms':S('The guide is [friendly] and [quiet].','导游友好而安静。','The [friendly] guide speaks [quietly] and explains [well].','这位友好的导游轻声讲话，并讲解得很好。','friendly 是形容词，描述 guide；quietly / well 修饰动作。不是所有 -ly 结尾都是副词。'),
   'writing.practical-advice':E('点击句子，检查环保建议的理由是否具体。','问题—行动—理由形成联系；最后表达期待，而不是声称问题已经解决。',[
    ['Plastic rubbish can harm birds near the river.','河边的塑料垃圾可能伤害鸟类。','指出问题及可能受影响的对象。'],
    ['We should put rubbish in bins to keep it out of the water.','我们应该把垃圾放进垃圾桶，避免它进入水体。','给出可以实行的行为，并解释目的。'],
    ['I hope more people will help keep the river clean.','我希望更多人一起保持河流清洁。','结尾表达期待；hope 不代表行动已经完成。']])
  },
  8:{
   'reading.event-order':E('点击时间词，把叙事中的先后关系找出来。','At first → Later → Finally。故事情节的顺序要由文本证据支持。',[
    ['At first, he felt the ground shake.','起初，他感到地面震动。','故事起点：先感受到异常。'],
    ['Later, he was trapped and waited for help.','后来，他被困住，等待帮助。','后续处境：被困与等待。'],
    ['Finally, rescuers reached him and he was safe.','最后，救援人员找到他，他安全了。','结局：获得救助。不要把这个故事当作所有灾害的统一流程。']]),
   'reading.feelings-evidence':E('哪些细节支持“紧张”，哪些体现他在尝试镇定？','情绪判断需要细节；“努力镇定”不等于已经完全不害怕。',[
    ['His heart was beating fast and his hands were shaking.','他心跳很快，双手发抖。','这些身体反应支持“紧张或害怕”。'],
    ['He told himself to calm down and called for help.','他告诉自己镇定下来，并呼救。','这是他试着调整情绪、采取行动的证据。'],
    ['He was wearing a school uniform.','他穿着校服。','衣着不能直接证明当时的情绪。',false]]),
   'past-continuous.was-were-doing':S('I [am reading]. My parents [are cooking].','我正在阅读。父母正在做饭。','At eight last night, I [was reading] and my parents [were cooking].','昨晚八点，我正在阅读，父母正在做饭。','时间移到过去某一时刻，am / are 变为 was / were；动词仍用 -ing。'),
   'past-continuous.negative-question':S('They [were sleeping].','他们当时正在睡觉。','They [were not sleeping]. [Were they] waiting for help?','他们当时没在睡觉。他们在等待帮助吗？','否定在 were 后加 not；疑问把 were 移到主语 they 前。'),
   'past-continuous.ongoing-or-finished':S('At eight, I [was reading] the book.','八点时，我正在读这本书。','At nine, I [finished] the book.','九点时，我读完了这本书。','八点观察的是进行中的动作；九点说明完成的事件。第一句本身没有交代何时读完。'),
   'when-while.background-interruption':S('At eight, I [was reading].','八点时，我正在阅读。','I [was reading] when the phone [rang].','我正在阅读时，电话响了。','was reading 是当时持续的背景动作；rang 表示突然发生的短事件，不据此断言阅读永久停止。'),
   'when-while.simultaneous-actions':S('I [was doing] homework. My sister [was drawing].','我当时在写作业。妹妹当时在画画。','[While] I was doing homework, my sister was drawing.','我写作业时，妹妹在画画。','while 把两个延续动作放在同一段时间内，两边都可用过去进行时。'),
   'writing.compound-words':S('[snow] + [storm] · [air] + [port]','雪＋暴风雨 · 航空＋港口','[snowstorm] · [airport]','暴风雪 · 机场','组合形成固定复合词。词序、连写方式和实际词义都要核对，不能任意拼接。'),
   'writing.avoid-warn':S('We should [avoid running] in heavy traffic.','我们应避免在车流密集处奔跑。','The teacher [warned us not to run] on the road.','老师警告我们不要在马路上奔跑。','avoid 后接 doing；warn 先接对象 us，再接 not to do。两句体现不同动词搭配。'),
   'writing.narrative-plan':E('点击句子，看一次经历如何从背景走向结果。','背景 → 突发事件 → 援助 → 结果；用持续动作与事件推进叙事。',[
    ['We were waiting at the bus stop when the storm began.','暴风雨开始时，我们正在公交站等车。','正在等车是背景；暴风雨开始是事件。'],
    ['Later, a teacher helped us get indoors.','后来，一位老师帮助我们进入室内。','用 later 承接事件，写清援助。'],
    ['Finally, we contacted our families and waited safely inside.','最后，我们联系了家人，在室内安全等待。','用 contacted / waited 写清这次经历的结果。']])
  }
 };
 const get=(unit,lesson,point)=>/^english-8a-0[1-8]$/.test(unit)?units[Number(unit.slice(-2))]?.[lesson+'.'+point]:undefined;
 function validate(unit,course){
  const expected=Object.entries(course.practice.groups).flatMap(([lesson,points])=>points.map(p=>lesson+'.'+p.id));
  const data=/^english-8a-0[1-8]$/.test(unit)&&units[Number(unit.slice(-2))];
  if(!data||Object.keys(data).length!==expected.length||expected.some(key=>!data[key]))throw Error('知识点演示与课程不匹配');
  for(const d of Object.values(data)){
   if(d.type==='sentence'&&![d.before,d.beforeZh,d.after,d.afterZh,d.note].every(v=>typeof v==='string'&&v.trim()))throw Error('词句演示缺少内容');
   if(d.type==='evidence'&&(!d.prompt||!d.conclusion||!d.lines?.some(l=>l.relevant)||d.lines.some(l=>![l.text,l.translation,l.reason].every(v=>typeof v==='string'&&v.trim()))))throw Error('阅读演示缺少证据');
   if(!['sentence','evidence','motion'].includes(d.type))throw Error('演示类型不受支持');
  }
 }
 window.GrowingEnglishPointDemos={get,validate};
})();
