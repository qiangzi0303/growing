/* Original error-focused practice aligned with the existing upper-book Unit 6 scope. */
(()=>{
 const lessons={};
 const add=(lesson,tab,p)=>{(lessons[lesson]||={tab,points:[]}).points.push(p);};
 add('reading','四季诗歌',{
  id:'images',title:'景物与季节',rule:'先找景物和动作，再概括诗中描绘的季节。',pitfall:'诗中的季节意象有语境，不能把某地景象当作全球气候规律。',
  sentence:'In autumn, leaves turn brown and farmers harvest crops.',translation:'秋天，树叶变棕，农民收割庄稼。',explain:'leaves turn brown 是景物变化，harvest crops 是活动；两条证据共同支持诗中的秋季画面。',
  animation:{kind:'sequence',actors:['读者','农民'],labels:['树叶变棕','收割庄稼','秋日意象']},rows:[
   ['诗句写“snow covers the ground”，最直接呈现什么？','地面被雪覆盖|庄稼正在收割|海水正在上涨','snow 和 covers 描写积雪，不应凭空补出收获或海水。'],
   ['在本课四季诗歌里，harvest crops 对应哪幅画面？','秋日收获|春日花开|夏日树荫','课文用收割庄稼表现秋季。'],
   ['“Leaves turn brown.”中的变化是？','叶子的颜色|农民的职业|风的方向','turn brown 描述颜色变棕。'],
   ['要找夏日树荫的意象，最应关注哪组词？','summer / shade|winter / snow|autumn / harvest','summer 和 shade 与夏日树荫对应。'],
   ['阅读季节诗时，哪种笔记最有用？','景物或动作 → 季节特点|只数每行的字母|只抄所有标点','概括需要景物、动作等证据。'],
   ['“Flowers open in the spring wind.”最直接描写？','春风中花朵开放|冬天河流结冰|秋天农民收割','flowers open 与 spring wind 都是明确线索。'],
   ['一段先写“brown leaves”，再写“farmers harvest crops”。哪项概括证据更足？','诗中描绘秋日变化和收获|诗中描绘终年冰雪|诗中证明各地每天都收获','两种意象共同指向本段的秋季情景。'],
   ['作者只写“孩子坐在夏日树荫下”。哪项没有依据？','世界各地夏天都一样凉爽|文中季节是夏天|孩子在树荫下','局部场景不能推出全球气候相同。'],
   ['诗中“冬雪→春花→夏荫→秋收”，最合适的整体概括是？','用不同景物与活动表现四季变化|说明同一天四个地点的温度完全相同|把四季写成四种动物','按意象变化概括，不添加文中没有的温度或动物。'],
   ['要写家乡秋天的一小段，哪组信息组织最合理？','当地秋日凉爽→树叶变色→散步→喜欢这份宁静|全球秋天每天相同→没有地点→随意下结论|只列单词，不说明景物和感受','从当地天气到景物、活动和感受，有范围也有重点。']
  ]
 });
 add('reading','四季诗歌',{
  id:'poetic-language',title:'拟人与押韵',rule:'拟人赋予事物人的动作；押韵看结尾发音，不只看拼写。',pitfall:'“树木忘记生长”是诗意表达，不是树木具有人的记忆的科学结论。',
  sentence:'The trees seem to sleep in the snow.',translation:'树木仿佛在雪中沉睡。',explain:'这是原创拟人例句。sleep 帮助读者想象冬日的安静；snow 与 grow 的尾音相呼应。',
  animation:{kind:'transform',actors:['诗人','读者'],labels:['冬树静止','仿佛沉睡','snow / grow']},rows:[
   ['把树木写成“忘记生长”，主要运用了？','拟人|测量|统计','“忘记”是人的心理活动，赋予植物这种特点属于拟人。'],
   ['哪组词在本课语境中押韵？','snow / grow|snow / tree|grow / rain','snow 和 grow 结尾都有 /əʊ/ 音。'],
   ['判断押韵时，应优先比较什么？','结尾发音|词的长短|首字母','押韵依据声音，不是字母数。'],
   ['“The wind whispers.”中的 whispers 让风像什么？','轻声说话的人|温度计|数学符号','把风声写成人的低语，是拟人。'],
   ['“树木在睡觉”在诗歌中最合理的理解是？','形象地写冬日树木的静态|证明树木每晚躺在床上|说明树木会做人的梦','诗意表达不应按人的生理活动逐字当成事实。'],
   ['哪句主要是直接天气陈述？','The temperature is two degrees.|The wind sings to the trees.|The flowers smile at us.','温度句直接陈述，后两句分别赋予风、花人的动作。'],
   ['诗中同时出现“flowers smile”和 snow / grow，分别体现？','拟人和押韵|统计和定义|押韵和实测温度','smile 赋予花人的动作；snow/grow 是声音呼应。'],
   ['“rain / again”在某些发音中可押韵，这说明判断押韵应？','核对实际读音|只要都有字母a就算|只要意思相近就算','不同读音会影响韵脚，拼写和意思都不能独立决定。'],
   ['“The trees forget to grow.”与“Winter slows their growth.”的表达特点有何不同？','前者拟人，后者直接陈述生长变化|前者提供准确实验数据，后者拟人|两句都说明树木有人的记忆','前句把植物当作会忘记的人，后句是直接陈述。'],
   ['写诗时用“风在低语”，解释诗意时怎样说最准确？','用拟人描绘轻柔风声，不把它解释为风真的说话|风能用英语对话，已经科学证实|只要写了whispers就一定押韵','区分修辞与事实；是否押韵还须看其他韵脚。']
  ]
 });
 add('sv-svo','主谓与主谓宾',{
  id:'subject-verb',title:'主语与谓语',rule:'S + V：主语说明谁或什么，谓语说明其动作。',pitfall:'不要因为动词后还有地点短语，就自动判断存在宾语。',
  sentence:'Birds fly in the sky.',translation:'鸟儿在空中飞翔。',explain:'Birds 是主语，fly 是谓语；in the sky 说明地点。去掉地点短语，Birds fly 仍有完整核心。',
  animation:{kind:'action',actors:['鸟儿'],labels:['Birds：主语','fly：动作','in the sky：地点']},rows:[
   ['“The sun shines.”中的主语是？','The sun|shines|sun shines','The sun 是发出动作的对象；shines 是谓语。'],
   ['“The wind blows.”中的谓语是？','blows|The wind|The','blows 表示风吹的动作。'],
   ['“Birds fly.”的核心结构是？','S + V|S + V + O|S + V + P','Birds 是主语，fly 作不及物动词，没有宾语或表语。'],
   ['“The baby sleeps at night.”中 at night 表示？','时间|直接宾语|主语','at night 回答什么时候睡。'],
   ['“Snow falls quietly.”中 quietly 的作用是？','说明落下的方式|充当被落下的物品|充当主语','quietly 是修饰 falls 的副词，不是宾语。'],
   ['“They arrived yesterday.”的核心主谓部分是？','They arrived|arrived yesterday|They yesterday','yesterday 是时间状语，核心为主语加谓语。'],
   ['“Birds fly over the lake every morning.”去掉地点和时间后剩下？','Birds fly.|Birds the lake.|Fly every.','over the lake 和 every morning 为状语，不是核心宾语。'],
   ['哪句虽有多个词，核心仍为 S + V？','The children laughed loudly in the room.|The children made a cake.|The children liked the story.','laughed 后的 loudly 和 in the room 都是状语；另两句有宾语。'],
   ['“The rain stopped at noon.”有人把 at noon 判成宾语，错在哪里？','它回答何时，不是动作作用的对象|任何介词都能作谓语|stopped 在任何句子中都必须带宾语','这里 stopped 不及物，at noon 是时间状语。'],
   ['观察记录“太阳升起；风吹着；鸟在空中飞”。哪项分析准确？','三个句子都可用 S + V 核心，地点另作状语|三个句子都一定有两个宾语|只要出现地点就必须用 S + V + O','rise、blow、fly 在这些语境中不直接带宾语。']
  ]
 });
 add('sv-svo','主谓与主谓宾',{
  id:'object',title:'辨认动作对象',rule:'S + V + O：宾语是动作直接作用的人或事物。',pitfall:'同一个 fly 在 Birds fly 中不带宾语，在 Children fly kites 中带宾语。',
  sentence:'Children fly kites in the park.',translation:'孩子们在公园里放风筝。',explain:'Children 是主语，fly 是谓语，kites 是宾语；in the park 是地点状语。先问“放什么”，再问“在哪里”。',
  animation:{kind:'action',actors:['孩子','风筝'],labels:['Children','fly kites','in the park']},rows:[
   ['“We build snowmen.”的宾语是？','snowmen|We|build','build 的对象是 snowmen。'],
   ['“Tom reads a poem.”的谓语和宾语分别是？','reads；a poem|Tom；reads|a poem；Tom','reads 表动作，a poem 是阅读对象。'],
   ['“The students like winter.”的核心结构是？','S + V + O|S + V|S + V + P','like 是及物动词，winter 是宾语。'],
   ['“They watch birds near the river.”中 near the river 是？','地点状语|直接宾语|谓语','watch 的宾语是 birds，地点短语说明观察地点。'],
   ['“She opened the window.”中谁实施动作？','She|the window|opened','She 是主语；the window 承受打开动作。'],
   ['哪句明确含有直接宾语？','We enjoy the sunshine.|The sun rises.|The wind blows.','enjoy 后的 the sunshine 是宾语。'],
   ['比较“Birds fly.”和“We fly kites.”，fly 的用法是？','前句不及物，后句及物|两句都没有宾语|前句及物，后句不及物','判断是否带宾语要结合当前句子。'],
   ['“Farmers harvest crops in autumn.”中哪些属于 S、V、O？','Farmers / harvest / crops|Farmers / crops / autumn|autumn / harvest / Farmers','in autumn 为时间，不纳入 SVO 核心。'],
   ['“The boy stopped the ball.”与“The rain stopped.”的结构差别是？','前句有宾语the ball，后句无宾语|两句中stopped后都必须补一个人|后句的rain是宾语','stop 在不同语境中可及物或不及物。'],
   ['把“孩子们昨天下午在公园堆雪人”标注结构，哪项正确？','Children主语；built谓语；snowmen宾语；其余为状语|park是唯一宾语；snowmen是谓语|yesterday是主语；Children是宾语','时间地点不改变 Children built snowmen 的核心结构。']
  ]
 });
 add('linking','主系表',{
  id:'predicate',title:'状态用形容词',rule:'系动词后用表语说明主语的状态、性质或身份。',pitfall:'描述“闻起来香、感觉冷”用形容词，不因前面是动词就一律用副词。',
  sentence:'The leaves turn yellow. The soup tastes nice.',translation:'树叶变黄了。汤尝起来很好。',explain:'yellow 描述 leaves，nice 描述 soup；turn、taste 在这里连接主语和表语。',
  animation:{kind:'transform',actors:['树叶','汤'],labels:['leaves','turn yellow','tastes nice']},rows:[
   ['The soup tastes ___.','nice|nicely|niceness','taste 作系动词，nice 为形容词表语。'],
   ['I feel ___ in this thin coat.','cold|coldly|coldness','feel cold 表示感觉冷。'],
   ['The sky becomes ___.','dark|darkly|darknesses','become 后形容词 dark 描述天空状态。'],
   ['“The leaves turn yellow.”中 yellow 是？','表语|宾语|主语','yellow 说明 leaves 的颜色状态。'],
   ['The music sounds ___.','beautiful|beautifully|beauty','sound 作系动词，后用形容词 beautiful。'],
   ['“The air is fresh.”的结构是？','S + V + P|S + V + O|S + V + IO + DO','is 连接主语 air 与表语 fresh。'],
   ['“The weather gets colder.”中 colder 描写谁或什么？','the weather|gets这个动作的方式|一个未出现的宾语','colder 是主语补充性质的表语。'],
   ['选出正确句子。','She looks happy today.|She looks happily today.（表达她看起来开心）|She looks happiness today.','表示看起来开心，look 为系动词，接 happy。'],
   ['“The flowers smell sweet.”为何不用 sweetly？','这里说明花的气味性质，用形容词作表语|所有-ly词都不能用于英语|sweetly是名词所以不能使用','sweetly 可作副词，但本句不是描述主动闻的方式。'],
   ['介绍秋景“天空变暗，树叶变黄，空气感觉凉爽”，哪组词形正确？','dark / yellow / cool|darkly / yellowly / coolly|darkness / yellowness / coolly','become、turn、feel 在这些句子中都是系动词，接形容词。']
  ]
 });
 add('linking','主系表',{
  id:'sense-action',title:'感官动词两种用法',rule:'同一动词可以连接性质，也可以表示主动动作；看完整句意。',pitfall:'He smells the flower 中 flower 是宾语；The flower smells sweet 中 sweet 是表语。',
  sentence:'He smells the flower. The flower smells sweet.',translation:'他闻这朵花。这朵花闻起来很香。',explain:'第一句有人主动闻，结构是 SVO；第二句描述花的气味，结构是 SVP。',
  animation:{kind:'choice',actors:['男孩','花'],labels:['主动闻花：SVO','花闻起来香：SVP','看语境辨用法']},rows:[
   ['“He smells the soup.”中的 smells 表示？','主动闻|闻起来|变得','主语人实施闻的动作，soup 是宾语。'],
   ['“The soup smells good.”中的 good 是？','表语|间接宾语|主语','good 说明 soup 的性质。'],
   ['哪句的 taste 是系动词？','The cake tastes sweet.|She tastes the cake.|He tasted some soup.','第一句说明蛋糕的味道；另两句有人品尝食物。'],
   ['“She tastes the soup carefully.”中 carefully 修饰？','品尝的动作|soup的味道|主语的身份','taste 在这里是动作动词，carefully 表示方式。'],
   ['“He looks at the birds.”中 look 的含义是？','看向鸟儿|看起来像鸟|变成鸟','look at 是主动看的动作。'],
   ['“He looks tired.”中 tired 说明？','他的状态|看的对象|鸟的数量','looks 在这里连接 he 与状态 tired。'],
   ['“She felt the cloth. It felt soft.”中的两个 felt 分别是？','触摸；摸起来|摸起来；触摸|两处都表示给别人东西','前句 cloth 是宾语，后句 soft 是表语。'],
   ['哪组搭配都适合括号所示句意？','smells good（闻起来好）；smells it carefully（仔细闻它）|smells well（闻起来好）；smells it careful（仔细闻它）|smells goodness（闻起来好）；smells it care（仔细闻它）','性质用形容词 good，主动动作的方式用副词 carefully。'],
   ['“The cook tasted the soup and said it tasted delicious.”两处 tasted 的结构应判断为？','第一处接宾语，第二处接表语|两处都接两个宾语|第一处没有宾语，第二处接宾语delicious','the soup 是品尝对象；delicious 描述 it 的味道。'],
   ['观察花朵后写“我仔细闻了花，它闻起来很香”。哪句准确？','I smelled the flower carefully. It smelled sweet.|I smelled the flower careful. It smelled sweetly.|I smelled carefully the sweetly. It flowered.','第一句动作加方式副词，第二句系动词加形容词表语。']
  ]
 });
 add('weather','天气与季节介绍',{
  id:'weather-words',title:'天气词形',rule:'天气名词可变成形容词；sunny、foggy 需双写末尾辅音。',pitfall:'rain 是名词或动词，rainy 是形容词；不能说 It is rain today。',
  sentence:'The sun is bright. It is sunny today.',translation:'太阳很明亮。今天阳光充足。',explain:'sun 为名词，sunny 为形容词。rain→rainy、snow→snowy、cloud→cloudy；fog→foggy。',
  animation:{kind:'weather',actors:['观察员'],labels:['sun → sunny','fog → foggy','rain → rainy']},rows:[
   ['sun 对应的天气形容词应写成？','sunny|suny|sunly','sun 双写 n 加 y。'],
   ['fog 的正确形容词形式是？','foggy|fogy|fogily','fog 双写 g 加 y。'],
   ['It is ___ today; take an umbrella.','rainy|rain|rains','is 后描述天气用形容词 rainy。'],
   ['cloud → ___。','cloudy|cloudly|cloudingy','cloud 加 y 得 cloudy。'],
   ['The road is white on this ___ morning.','snowy|snowly|snows','修饰 morning 用形容词 snowy。'],
   ['Which sentence is correct?（选择词形正确的天气句）','There is a lot of rain.|There is a lot of rainy.|There is a lot of rains today.','a lot of 后用不可数名词 rain，不用形容词。'],
   ['“今天下雨”和“今天多雨”的正确表达分别是？','It is raining today.; It is rainy today.|It is rainy today.; It is rain today.|It raining today.; It rainy today.','raining 与 is 构成进行时；rainy 是形容词表语。'],
   ['选出两处都正确：There is much ___. It is ___.','fog; foggy|foggy; fog|fog; fogy','名词 fog 表示雾，形容词 foggy 描述天气。'],
   ['为什么不能把所有天气词机械地“原词直接加y”？','sun、fog等需要双写，仍须核对拼写|所有词都必须双写最后两个字母|rain必须写成rainny','部分单词有拼写变化，rainy、cloudy 等不双写。'],
   ['天气日记“昨夜有雪，今天晴朗”，哪句准确？','There was snow last night. It is sunny today.|There was snowy last night. It is suny today.|There was snowly last night. It is sun today.','there was 后用名词 snow；今天晴朗用形容词 sunny。']
  ]
 });
 add('weather','天气与季节介绍',{
  id:'temperature',title:'天气问法与温度',rule:'问天气用 What is the weather like?；below zero 表示零下。',pitfall:'What...like? 与 How...? 是两种问法，不混成 How is the weather like?。',
  sentence:'The temperature is five degrees below zero.',translation:'气温是零下五度。',explain:'below 表示低于，above 表示高于；先读数字，再确定在零上还是零下。',
  animation:{kind:'quantity',actors:['温度计'],labels:['零下五度','零度','零上五度'],values:[-5,0,5]},rows:[
   ['询问天气时，哪句正确？','What is the weather like today?|How is the weather like today?|What does the weather today?','What is ... like? 是完整问法。'],
   ['与 What is the weather like? 同义的问法是？','How is the weather?|How does the weather like?|What the weather is?','How is the weather? 不加 like。'],
   ['three degrees below zero 表示？','零下三度|零上三度|三十度','below zero 是零度以下。'],
   ['four degrees above zero 表示？','零上四度|零下四度|四十度','above zero 是零度以上。'],
   ['温度为 -2°C，应该读作？','two degrees below zero|two degrees above zero|twenty degrees','负号对应 below zero。'],
   ['温度为 1°C 时，degree 应用什么形式？','one degree|one degrees|one degreees','one 后用单数 degree。'],
   ['从零下四度升到零上二度，总共升高多少度？','六度|两度|负六度','跨过零点，2 - (-4) = 6。'],
   ['“How is the weather like?”应怎样改成正确天气问句？','删掉like，或把How改成What|只把weather改成weathers|在like后再加一个is','两种正确结构不能混用。'],
   ['早晨 -3°C，中午 2°C，哪句比较正确？','It is five degrees warmer at noon.|It is five degrees colder at noon.|It is only one degree warmer at noon.','2比-3高5度，warmer 表示更暖。'],
   ['给游客写天气提示，预报 -5°C，哪句信息一致？','It will be five degrees below zero. Wear warm clothes.|It will be five degrees above zero. The forecast says -5°C.|It will be fifty degrees. The forecast says -5°C.','温度读法须与负五度对应；建议也应回应低温。']
  ]
 });
 add('weather','天气与季节介绍',{
  id:'season-writing',title:'有范围、有理由的介绍',rule:'按地点时段→天气景物→活动→喜好原因介绍季节。',pitfall:'because 引出理由；不要把“我家乡如此”扩大成“全世界都如此”。',
  sentence:'I like autumn in my hometown because it is cool and I can walk by the lake.',translation:'我喜欢家乡的秋天，因为天气凉爽，我可以在湖边散步。',explain:'in my hometown 限定地点，because 后说明喜好原因；活动与季节特点对应。',
  animation:{kind:'sequence',actors:['介绍者','听者'],labels:['家乡的秋天','凉爽，可散步','because：说明理由']},rows:[
   ['介绍季节时，哪项可以限定地域？','in my hometown|all people everywhere|always the same everywhere','地点短语限制描述范围。'],
   ['I like spring ___ flowers begin to open.','because|but|or','花开是喜欢春天的理由，用 because。'],
   ['哪句话给出了明确活动？','We fly kites in the park.|Spring is a season.|There are four seasons.','fly kites 说明具体做什么。'],
   ['“I feel relaxed.”在季节介绍中主要表达？','感受|地理位置|温度单位','relaxed 表示放松的感受。'],
   ['哪项是完整的喜好及理由？','I like winter because I enjoy making snowmen.|Because winter.|I winter because like.','主句表达喜欢，从句给出原因。'],
   ['“In our town, summer is often rainy.”中的 often 有何作用？','表示常常，避免绝对化|表示永远不下雨|表示全球天气相同','often 不是 always，且句首限定了地点。'],
   ['段落先写晴天，再写放风筝，最后写开心，最适合补在开头的是？','In spring in my hometown, ...|All places always have the same weather.|This paragraph has no season.','交代季节地点，后续天气、活动与感受更清楚。'],
   ['“I like winter because summer is hot.”若要重点介绍冬天，最值得补充什么？','冬天的特点和自己具体喜欢的活动|与季节无关的电话号码|只重复三次winter','补上正面的具体理由，内容更聚焦。'],
   ['同学说“我家乡冬天不下雪，所以所有地方冬天都不下雪”。问题是？','把局部观察扩大为全球结论|用了冬天这个词|没有把snow改成复数','地点和气候不同，不能作这样的全称推断。'],
   ['哪段适合作为季节短文结尾？','I enjoy these quiet autumn walks, so autumn is my favourite season here.|Every place on earth has exactly our weather.|I like autumn. My pen has three parts.','结尾回应活动与感受，并保留当地范围；另两项分别绝对化和跑题。']
  ]
 });
 window.GrowingEnglishPointCourses.define('english-8a-06',{lessons});
})();
