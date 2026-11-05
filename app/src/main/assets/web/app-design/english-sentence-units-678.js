/* Original practice aligned with the verified upper-term lessons, not textbook quotations. */
(function(root,factory){const data=factory();if(typeof module==='object'&&module.exports)module.exports=data;else Object.assign(root.SentenceUnitContent||(root.SentenceUnitContent={}),data);})(globalThis,()=>{
 'use strict';
 const roles={S:'主语',V:'谓语',O:'宾语',A:'状语',P:'表语',I:'间接宾语',D:'直接宾语',C:'宾补',J:'连接词',F:'从句'};
 // Segments are explicit, ordered grammar annotations; punctuation stays with its segment.
 const s=(zh,...parts)=>({zh,en:parts.map(p=>p.slice(2)).join(' '),groups:parts.map(p=>[roles[p[0]],p.slice(2)])});
 const t=(id,title,explanation,sentences)=>({id,title,explanation,sentences});
 const units={
 6:{number:6,title:'Seasons',topics:[
 t('reading','阅读：四季诗歌中的意象','通过景物、动作和感受理解季节意象；诗歌中的拟人不是科学定义。以下为原创练习。',[
 s('风轻轻地吹着。','S:The wind','V:blows','A:softly.'),
 s('鸟儿在春天歌唱。','S:Birds','V:sing','A:in spring.'),
 s('夏天，孩子们在树下休息。','A:In summer,','S:children','V:rest','A:under trees.'),
 s('秋天，树叶变成棕色。','A:In autumn,','S:leaves','V:turn','P:brown.'),
 s('冬天，雪覆盖着田野。','A:In winter,','S:snow','V:covers','O:the fields.'),
 s('农民在秋天收割庄稼。','S:Farmers','V:harvest','O:crops','A:in autumn.'),
 s('春天，花儿在暖风中摇摆。','A:In spring,','S:flowers','V:dance','A:in the warm wind.'),
 s('诗人把冬天的树写成沉睡的朋友。','S:The poet','V:describes','O:winter trees','A:as sleeping friends.'),
 s('尽管田野很安静，但这首诗听起来充满生机。','F:Although the fields are quiet,','S:the poem','V:sounds','P:full of life.'),
 s('在我的诗中，春天带来花朵，冬天带来雪。','A:In my poem,','S:spring','V:brings','O:flowers,','J:and','S:winter','V:brings','O:snow.')
 ]),
 t('sv-svo','语法：主谓与主谓宾','主谓结构中的不及物动词不直接带宾语；主谓宾结构有动作对象，时间地点状语不算宾语。',[
 s('太阳照耀着。','S:The sun','V:shines.'),
 s('风吹着。','S:The wind','V:blows.'),
 s('鸟在飞。','S:Birds','V:fly.'),
 s('孩子们堆雪人。','S:Children','V:build','O:snowmen.'),
 s('鸟吃种子。','S:Birds','V:eat','O:seeds.'),
 s('我们种树。','S:We','V:plant','O:trees.'),
 s('春天，鸟儿在天空中飞翔。','A:In spring,','S:birds','V:fly','A:in the sky.'),
 s('孩子们在公园里放风筝。','S:Children','V:fly','O:kites','A:in the park.'),
 s('风停后，我们在公园里收集树叶。','F:After the wind stops,','S:we','V:collect','O:leaves','A:in the park.'),
 s('太阳照耀着，孩子们在河边种树。','S:The sun','V:shines,','J:and','S:children','V:plant','O:trees','A:beside the river.')
 ]),
 t('linking','语法：主系表与感官动词','系动词连接主语与表语，表语说明主语状态；感官动词作系动词时接形容词。smell也能作及物动词。',[
 s('天空是蓝色的。','S:The sky','V:is','P:blue.'),
 s('树叶变黄了。','S:The leaves','V:turn','P:yellow.'),
 s('汤闻起来很香。','S:The soup','V:smells','P:good.'),
 s('花闻起来很香甜。','S:The flowers','V:smell','P:sweet.'),
 s('风感觉很冷。','S:The wind','V:feels','P:cold.'),
 s('你的想法听起来很棒。','S:Your idea','V:sounds','P:great.'),
 s('女孩闻着花。','S:The girl','V:smells','O:the flowers.'),
 s('日落后，天空变暗了。','A:After sunset,','S:the sky','V:becomes','P:dark.'),
 s('虽然今天早上天气很冷，但汤尝起来很美味。','F:Although it is cold this morning,','S:the soup','V:tastes','P:delicious.'),
 s('树叶看起来很漂亮，空气在雨后感觉很清新。','S:The leaves','V:look','P:beautiful,','J:and','S:the air','V:feels','P:fresh','A:after the rain.')
 ]),
 t('weather','综合运用：天气构词与季节介绍','rainy、snowy、cloudy由天气名词加-y构成；sunny和foggy双写。介绍季节需限定地点，below zero表示零下。',[
 s('今天晴朗。','S:It','V:is','P:sunny','A:today.'),
 s('今天早上多云。','S:It','V:is','P:cloudy','A:this morning.'),
 s('今天晚上有雾。','S:It','V:is','P:foggy','A:this evening.'),
 s('今天这里有风。','S:It','V:is','P:windy','A:here today.'),
 s('我的家乡今天下雨。','S:It','V:is','P:rainy','A:in my hometown today.'),
 s('我喜欢春天，因为这里天气暖和。','S:I','V:like','O:spring','F:because it is warm here.'),
 s('北京今天的天气凉爽而晴朗。','S:The weather in Beijing','V:is','P:cool and sunny','A:today.'),
 s('今天早上这里的气温是零下五度。','S:The temperature','V:is','P:five degrees below zero','A:here this morning.'),
 s('虽然我的家乡冬天经常下雪，但我喜欢在户外玩耍。','F:Although it is often snowy in my hometown in winter,','S:I','V:enjoy','O:playing outside.'),
 s('我喜欢家乡的秋天，因为天气凉爽，我们可以放风筝。','S:I','V:like','O:autumn in my hometown','F:because it is cool and we can fly kites.')
 ])],lexicon:{}},
 7:{number:7,title:'The natural world',topics:[
 t('reading','阅读：生态系统的成员与作用','生态系统包括生物与非生物。湿地蓄水净水，森林提供家园；人体器官类比是比喻。',[
 s('湿地储存水。','S:Wetlands','V:store','O:water.'),
 s('森林净化空气。','S:Forests','V:clean','O:the air.'),
 s('动物需要水。','S:Animals','V:need','O:water.'),
 s('植物需要阳光。','S:Plants','V:need','O:sunlight.'),
 s('森林为鸟类提供家园。','S:Forests','V:provide','O:homes','A:for birds.'),
 s('湿地有助于净水。','S:Wetlands','V:help','O:clean water.'),
 s('污染可能导致严重的问题。','S:Pollution','V:can lead','A:to serious problems.'),
 s('一个生态系统包括生物和非生物。','S:An ecosystem','V:includes','O:living and non-living things.'),
 s('虽然水不是生物，但它是生态系统的重要组成部分。','F:Although water is not alive,','S:it','V:is','P:an important part of an ecosystem.'),
 s('我们应该保护湿地，因为湿地蓄水并为野生动物提供家园。','S:We','V:should protect','O:wetlands','F:because they store water and provide homes for wildlife.')
 ]),
 t('double-object','语法：主谓双宾语','间接宾语通常指接受者，直接宾语通常指物；give/show/send/teach常配to，buy/make/cook常配for。',[
 s('她给了我一本书。','S:She','V:gave','I:me','D:a book.'),
 s('他给我们看了一张地图。','S:He','V:showed','I:us','D:a map.'),
 s('我给她寄了一张照片。','S:I','V:sent','I:her','D:a photo.'),
 s('妈妈给我买了一件外套。','S:Mum','V:bought','I:me','D:a coat.'),
 s('爸爸给我们做了晚饭。','S:Dad','V:cooked','I:us','D:dinner.'),
 s('我们给她做了一张卡片。','S:We','V:made','I:her','D:a card.'),
 s('老师给学生们看了湿地的照片。','S:The teacher','V:showed','O:photos of wetlands','A:to the students.'),
 s('我的朋友为我做了一个鸟屋。','S:My friend','V:made','O:a birdhouse','A:for me.'),
 s('当我们参观森林时，导游教了我们一首歌。','F:When we visited the forest,','S:the guide','V:taught','I:us','D:a song.'),
 s('我们给客人们看了我们的海报，并给他们一些卡片。','S:We','V:showed','I:the visitors','D:our posters','J:and','V:gave','I:them','D:some cards.')
 ]),
 t('complement','语法：主谓宾与宾语补足语','宾语补足语说明宾语的状态、身份或动作。keep the water clean中的clean描述water，不是第二个宾语。',[
 s('我们保持水的清洁。','S:We','V:keep','O:the water','C:clean.'),
 s('这个消息使我们高兴。','S:The news','V:made','O:us','C:happy.'),
 s('我们把这只鸟叫作雪儿。','S:We','V:call','O:the bird','C:Snowy.'),
 s('他们发现房间空了。','S:They','V:found','O:the room','C:empty.'),
 s('请把门开着。','V:Please keep','O:the door','C:open.'),
 s('这首歌使我感到平静。','S:The song','V:makes','O:me','C:calm.'),
 s('我们选她当我们的组长。','S:We','V:chose','O:her','C:our leader.'),
 s('老师让我们仔细观察鸟。','S:The teacher','V:asked','O:us','C:to watch birds carefully.'),
 s('当我们回到教室时，我们发现窗户关着。','F:When we returned to the classroom,','S:we','V:found','O:the windows','C:closed.'),
 s('我们应该保持公园清洁，并让游客感到受欢迎。','S:We','V:should keep','O:the park','C:clean','J:and','V:make','O:visitors','C:feel welcome.')
 ]),
 t('conjunctions','语法：and / but / or / so','and并列，but转折，or选择或否则，so结果；because与so不重复用于同一组主从句。',[
 s('我们种树和花。','S:We','V:plant','O:trees and flowers.'),
 s('房间很小但很舒适。','S:The room','V:is','P:small but comfortable.'),
 s('你可以写信或者发邮件。','S:You','V:can write','O:a letter','J:or','V:send','O:an email.'),
 s('天很冷，所以我们关上了窗户。','S:It','V:was','P:cold,','J:so','S:we','V:closed','O:the window.'),
 s('我们不能唱歌或跳舞。','S:We','V:cannot sing or dance.'),
 s('我喜欢鸟，但我哥哥喜欢鱼。','S:I','V:like','O:birds,','J:but','S:my brother','V:likes','O:fish.'),
 s('带一张地图，否则你可能会迷路。','V:Take','O:a map,','J:or','S:you','V:may get','P:lost.'),
 s('因为下雨了，我们待在家里。','F:Because it rained,','S:we','V:stayed','A:at home.'),
 s('任务很难，但我们齐心协力，所以按时完成了它。','S:The task','V:was','P:hard,','J:but','S:we','V:worked','A:together,','J:so','S:we','V:finished','O:it','A:on time.'),
 s('我们可以清理河岸或者制作海报，但我们不应该打扰鸟类。','S:We','V:can clean','O:the river bank','J:or','V:make','O:posters,','J:but','S:we','V:should not disturb','O:birds.')
 ]),
 t('writing','综合运用：-ly与环保建议','副词修饰动作，如quietly、carefully；friendly是形容词。环保建议应具体、可实行并说明理由。',[
 s('请安静地行走。','V:Please walk','A:quietly.'),
 s('请仔细地听。','V:Please listen','A:carefully.'),
 s('这些孩子开心地笑了。','S:The children','V:smiled','A:happily.'),
 s('我们的导游很友好。','S:Our guide','V:is','P:friendly.'),
 s('我们应该节约用水。','S:We','V:should save','O:water.'),
 s('请把垃圾放进垃圾桶。','V:Please put','O:rubbish','A:in the bin.'),
 s('我们应该轻声说话，以免惊吓鸟类。','S:We','V:should speak','A:quietly to avoid frightening birds.'),
 s('我们可以使用这张纸的两面。','S:We','V:can use','O:both sides of this paper.'),
 s('因为湿地是鸟类的家园，我们应该保持湿地清洁。','F:Because wetlands are homes for birds,','S:we','V:should keep','O:them','C:clean.'),
 s('请轻声说话并带走你的垃圾，这样鸟儿才能安全地生活。','V:Please speak','A:quietly','J:and','V:take','O:your rubbish','A:away','F:so that birds can live safely.')
 ])],lexicon:{}},
 8:{number:8,title:'Safe and sound',topics:[
 t('reading','阅读：地震叙事的时间线与情绪变化','用时间、声音、动作和情绪整理故事；以下是原创叙事练习，并非通用应急处置指令。',[
 s('起初，他感到紧张。','A:At first,','S:he','V:felt','P:nervous.'),
 s('地面开始摇晃。','S:The ground','V:started','O:to shake.'),
 s('他听到一声巨响。','S:He','V:heard','O:a loud noise.'),
 s('他努力使自己平静下来。','S:He','V:tried','O:to calm down.'),
 s('然后，他等待救援。','A:Then,','S:he','V:waited','A:for help.'),
 s('最后，救援人员找到了他。','A:Finally,','S:rescuers','V:found','O:him.'),
 s('当他听到人声时，他大声呼救。','F:When he heard voices,','S:he','V:shouted','A:for help.'),
 s('他当时很害怕，但他没有放弃希望。','S:He','V:was','P:afraid,','J:but','S:he','V:did not lose','O:hope.'),
 s('救援人员到达之前，他正静静地等待着。','F:Before the rescuers arrived,','S:he','V:was waiting','A:quietly.'),
 s('故事以一声巨响开始，以救援人员找到男孩结束。','S:The story','V:begins','A:with a loud noise','J:and','V:ends','A:with rescuers finding the boy.')
 ]),
 t('past-continuous','语法：过去进行时','过去某时正在进行用was/were + 动词-ing；否定加not，疑问句把was/were提前。注意主谓一致。',[
 s('昨晚八点，我正在看书。','A:At eight last night,','S:I','V:was reading.'),
 s('昨天下午五点，她正在做饭。','A:At five yesterday afternoon,','S:she','V:was cooking.'),
 s('昨天这个时候，他们正在踢足球。','A:At this time yesterday,','S:they','V:were playing','O:football.'),
 s('昨晚九点，他没有在睡觉。','A:At nine last night,','S:he','V:was not sleeping.'),
 s('昨天六点，我们正在吃晚饭。','A:At six yesterday,','S:we','V:were having','O:dinner.'),
 s('昨晚七点，你正在学习。','A:At seven last night,','S:you','V:were studying.'),
 s('昨天这个时候，你正在等公交车吗？','V:Were','S:you','V:waiting','A:for the bus at this time yesterday?'),
 s('昨晚八点，她正在做什么？','O:What','V:was','S:she','V:doing','A:at eight last night?'),
 s('昨晚八点，我在看书，而我父母在做饭。','A:At eight last night,','S:I','V:was reading','J:and','S:my parents','V:were cooking.'),
 s('昨天下午五点，我们正在制作海报，没有在玩游戏。','A:At five yesterday afternoon,','S:we','V:were making','O:posters','J:and','V:were not playing','O:games.')
 ]),
 t('when-while','语法：when / while / as','长动作常用过去进行时作背景，短动作用一般过去时；while从句通常表示延续动作，as可表示一边……一边……。',[
 s('电话响时，我正在看书。','S:I','V:was reading','F:when the phone rang.'),
 s('我做饭时，她正在画画。','F:While I was cooking,','S:she','V:was drawing.'),
 s('公交车到达时，我们正在等候。','S:We','V:were waiting','F:when the bus arrived.'),
 s('妈妈做饭时，爸爸正在洗碗。','F:While Mum was cooking,','S:Dad','V:was washing','O:the dishes.'),
 s('我走路回家时，开始下雨了。','F:While I was walking home,','S:it','V:started','O:to rain.'),
 s('她一边走路一边唱歌。','S:She','V:sang','F:as she walked.'),
 s('老师进来时，学生们正在安静地阅读。','F:When the teacher came in,','S:the students','V:were reading','A:quietly.'),
 s('我正在收拾书包时，我姐姐正在穿外套。','F:While I was packing my bag,','S:my sister','V:was putting on','O:her coat.'),
 s('当我们正在讨论故事时，铃响了，我们停止了说话。','F:While we were discussing the story,','S:the bell','V:rang','J:and','S:we','V:stopped','O:talking.'),
 s('我正在写报告时灯灭了，所以我停止了工作。','S:I','V:was writing','O:a report','F:when the lights went out,','J:so','S:I','V:stopped','O:working.')
 ]),
 t('writing','综合运用：构词与安全主题叙事','用时间、地点、经过和结果写叙事；avoid后接动名词，warn sb not to do。故事情节不代替专业应急指导。',[
 s('昨晚一场暴风雪袭击了这个城镇。','S:A snowstorm','V:hit','O:the town','A:last night.'),
 s('今天早上机场关闭了。','S:The airport','V:was','P:closed','A:this morning.'),
 s('我们应该避免在马路上玩耍。','S:We','V:should avoid','O:playing on the road.'),
 s('老师警告我们不要在这里游泳。','S:The teacher','V:warned','O:us','C:not to swim here.'),
 s('消防员扑灭了火。','S:Firefighters','V:put out','O:the fire.'),
 s('最后，所有人都安全了。','A:Finally,','S:everyone','V:was','P:safe.'),
 s('我们正走向学校时，听到了一声巨响。','F:As we were walking to school,','S:we','V:heard','O:a loud noise.'),
 s('警察警告司机们不要在雪中开快车。','S:The police','V:warned','O:drivers','C:not to drive fast in the snow.'),
 s('当消防员到达时，邻居们正在外面等候。','F:When the firefighters arrived,','S:the neighbours','V:were waiting','A:outside.'),
 s('昨天八点，我们正在家里吃早饭，暴风雪开始了。','A:At eight yesterday,','S:we','V:were having','O:breakfast','A:at home','F:when the snowstorm began.')
 ])],lexicon:{}}
 };
 const dictionary=`
a|ə|冠词|一个
afraid|əˈfreɪd|形容词|害怕的
after|ˈɑːftə|介词/连词|在……之后
afternoon|ˌɑːftəˈnuːn|名词|下午
air|eə|名词|空气
airport|ˈeəpɔːt|名词|机场
alive|əˈlaɪv|形容词|活着的
although|ɔːlˈðəʊ|连词|虽然
an|ən|冠词|一个
and|ænd|连词|和；并且
animals|ˈænɪməlz|名词|动物们
are|ɑː|系动词|是
arrived|əˈraɪvd|动词|到达了
as|æz|介词/连词|作为；当……时
asked|ɑːskt|动词|要求了
at|æt|介词|在
autumn|ˈɔːtəm|名词|秋天
avoid|əˈvɔɪd|动词|避免
away|əˈweɪ|副词|离开
bag|bæɡ|名词|书包
bank|bæŋk|名词|岸
beautiful|ˈbjuːtɪfəl|形容词|漂亮的
because|bɪˈkɒz|连词|因为
becomes|bɪˈkʌmz|系动词|变得
before|bɪˈfɔː|连词|在……之前
began|bɪˈɡæn|动词|开始了
begins|bɪˈɡɪnz|动词|开始
beijing|ˌbeɪˈdʒɪŋ|专有名词|北京
bell|bel|名词|铃
below|bɪˈləʊ|介词|低于
beside|bɪˈsaɪd|介词|在……旁边
bin|bɪn|名词|垃圾桶
bird|bɜːd|名词|鸟
birdhouse|ˈbɜːdhaʊs|名词|鸟屋
birds|bɜːdz|名词|鸟类
blows|bləʊz|动词|吹
blue|bluː|形容词|蓝色的
book|bʊk|名词|书
both|bəʊθ|限定词|两者的
bought|bɔːt|动词|买了
boy|bɔɪ|名词|男孩
breakfast|ˈbrekfəst|名词|早饭
brings|brɪŋz|动词|带来
brother|ˈbrʌðə|名词|哥哥；弟弟
brown|braʊn|形容词|棕色的
build|bɪld|动词|建造；堆
bus|bʌs|名词|公交车
but|bʌt|连词|但是
call|kɔːl|动词|把……叫作
calm|kɑːm|形容词/动词|平静的；使镇静
came|keɪm|动词|来了
can|kæn|情态动词|能够
cannot|ˈkænɒt|情态动词|不能
card|kɑːd|名词|卡片
cards|kɑːdz|名词|卡片们
carefully|ˈkeəfəli|副词|仔细地
children|ˈtʃɪldrən|名词|孩子们
chose|tʃəʊz|动词|选择了
classroom|ˈklɑːsruːm|名词|教室
clean|kliːn|动词/形容词|清洁；干净的
closed|kləʊzd|动词/形容词|关上了；关闭的
cloudy|ˈklaʊdi|形容词|多云的
coat|kəʊt|名词|外套
cold|kəʊld|形容词|寒冷的
collect|kəˈlekt|动词|收集
comfortable|ˈkʌmftəbl|形容词|舒适的
cooked|kʊkt|动词|做了饭
cooking|ˈkʊkɪŋ|动词-ing形式|做饭
cool|kuːl|形容词|凉爽的
covers|ˈkʌvəz|动词|覆盖
crops|krɒps|名词|庄稼
dad|dæd|名词|爸爸
dance|dɑːns|动词|跳舞；摇摆
dark|dɑːk|形容词|昏暗的
degrees|dɪˈɡriːz|名词|度
delicious|dɪˈlɪʃəs|形容词|美味的
describes|dɪˈskraɪbz|动词|描述
did|dɪd|助动词|过去时助动词
dinner|ˈdɪnə|名词|晚饭
discussing|dɪˈskʌsɪŋ|动词-ing形式|讨论
dishes|ˈdɪʃɪz|名词|餐具
disturb|dɪˈstɜːb|动词|打扰
doing|ˈduːɪŋ|动词-ing形式|做
door|dɔː|名词|门
down|daʊn|副词|下来（与前词搭配表示平静下来）
drawing|ˈdrɔːɪŋ|动词-ing形式|画画
drive|draɪv|动词|驾驶
drivers|ˈdraɪvəz|名词|司机们
eat|iːt|动词|吃
ecosystem|ˈiːkəʊsɪstəm|名词|生态系统
eight|eɪt|数词|八
email|ˈiːmeɪl|名词|电子邮件
empty|ˈempti|形容词|空的
ends|endz|动词|结束
enjoy|ɪnˈdʒɔɪ|动词|喜欢；享受
evening|ˈiːvnɪŋ|名词|晚上
everyone|ˈevriwʌn|代词|所有人
farmers|ˈfɑːməz|名词|农民们
fast|fɑːst|副词|快地
feel|fiːl|系动词|感到
feels|fiːlz|系动词|感觉
felt|felt|系动词|感到了
fields|fiːldz|名词|田野
finally|ˈfaɪnəli|副词|最后
finding|ˈfaɪndɪŋ|动名词|找到
finished|ˈfɪnɪʃt|动词|完成了
fire|ˈfaɪə|名词|火
firefighters|ˈfaɪəfaɪtəz|名词|消防员们
first|fɜːst|名词|最初（与前词搭配表示起初）
fish|fɪʃ|名词|鱼
five|faɪv|数词|五
flowers|ˈflaʊəz|名词|花朵
fly|flaɪ|动词|飞；放飞
foggy|ˈfɒɡi|形容词|有雾的
football|ˈfʊtbɔːl|名词|足球
for|fɔː|介词|为；为了
forest|ˈfɒrɪst|名词|森林
forests|ˈfɒrɪsts|名词|森林
found|faʊnd|动词|找到了；发现了
fresh|freʃ|形容词|清新的
friend|frend|名词|朋友
friendly|ˈfrendli|形容词|友好的
friends|frendz|名词|朋友们
frightening|ˈfraɪtnɪŋ|动名词|惊吓
full|fʊl|形容词|充满的
games|ɡeɪmz|名词|游戏
gave|ɡeɪv|动词|给了
get|ɡet|系动词|变得
girl|ɡɜːl|名词|女孩
good|ɡʊd|形容词|好的；香的
great|ɡreɪt|形容词|很棒的
ground|ɡraʊnd|名词|地面
guide|ɡaɪd|名词|导游
happily|ˈhæpɪli|副词|开心地
happy|ˈhæpi|形容词|高兴的
hard|hɑːd|形容词|困难的
harvest|ˈhɑːvɪst|动词|收割
having|ˈhævɪŋ|动词-ing形式|吃；进行
he|hiː|代词|他
heard|hɜːd|动词|听到了
help|help|动词/名词|帮助；救援
her|hɜː|代词/限定词|她；她的
here|hɪə|副词|这里
him|hɪm|代词|他（宾格）
hit|hɪt|动词|袭击了
home|həʊm|名词/副词|家；回家
homes|həʊmz|名词|家园
hometown|ˈhəʊmtaʊn|名词|家乡
hope|həʊp|名词|希望
i|aɪ|代词|我
idea|aɪˈdɪə|名词|想法
important|ɪmˈpɔːtənt|形容词|重要的
in|ɪn|介词/副词|在……里；进来
includes|ɪnˈkluːdz|动词|包括
is|ɪz|系动词|是
it|ɪt|代词|它；天气主语
keep|kiːp|动词|保持
kites|kaɪts|名词|风筝
last|lɑːst|限定词|上一个的
lead|liːd|动词|导致（与后接介词连用）
leader|ˈliːdə|名词|组长
leaves|liːvz|名词|树叶
letter|ˈletə|名词|信
life|laɪf|名词|生命；生机
lights|laɪts|名词|灯
like|laɪk|动词/介词|喜欢；像
likes|laɪks|动词|喜欢
listen|ˈlɪsən|动词|听
live|lɪv|动词|生活
living|ˈlɪvɪŋ|形容词|有生命的
look|lʊk|系动词|看起来
lose|luːz|动词|失去
lost|lɒst|形容词|迷路的
loud|laʊd|形容词|响亮的
made|meɪd|动词|制作了；使得
make|meɪk|动词|制作；使
makes|meɪks|动词|使
making|ˈmeɪkɪŋ|动词-ing形式|制作
map|mæp|名词|地图
may|meɪ|情态动词|可能
me|miː|代词|我（宾格）
morning|ˈmɔːnɪŋ|名词|早晨
mum|mʌm|名词|妈妈
my|maɪ|限定词|我的
need|niːd|动词|需要
neighbours|ˈneɪbəz|名词|邻居们
nervous|ˈnɜːvəs|形容词|紧张的
news|njuːz|名词|消息
night|naɪt|名词|夜晚
nine|naɪn|数词|九
noise|nɔɪz|名词|声响
non-living|ˌnɒnˈlɪvɪŋ|形容词|非生物的
not|nɒt|副词|不
of|ɒv|介词|……的
often|ˈɒfən|副词|经常
on|ɒn|介词/副词|在……上；穿上
open|ˈəʊpən|形容词|开着的
or|ɔː|连词|或者；否则
our|aʊə|限定词|我们的
out|aʊt|副词|熄灭（与前面的动词连用）
outside|ˌaʊtˈsaɪd|副词|在外面
packing|ˈpækɪŋ|动词-ing形式|收拾
paper|ˈpeɪpə|名词|纸
parents|ˈpeərənts|名词|父母
park|pɑːk|名词|公园
part|pɑːt|名词|部分
phone|fəʊn|名词|电话
photo|ˈfəʊtəʊ|名词|照片
photos|ˈfəʊtəʊz|名词|照片
plant|plɑːnt|动词|种植
plants|plɑːnts|名词|植物
playing|ˈpleɪɪŋ|动词-ing形式|玩；踢球
please|pliːz|感叹词|请
poem|ˈpəʊɪm|名词|诗
poet|ˈpəʊɪt|名词|诗人
police|pəˈliːs|名词|警察
pollution|pəˈluːʃən|名词|污染
posters|ˈpəʊstəz|名词|海报
problems|ˈprɒbləmz|名词|问题
protect|prəˈtekt|动词|保护
provide|prəˈvaɪd|动词|提供
put|pʊt|动词|放；置
putting|ˈpʊtɪŋ|动词-ing形式|放；穿
quiet|ˈkwaɪət|形容词|安静的
quietly|ˈkwaɪətli|副词|安静地
rain|reɪn|动词/名词|下雨；雨
rained|reɪnd|动词|下雨了
rainy|ˈreɪni|形容词|下雨的
rang|ræŋ|动词|响了
reading|ˈriːdɪŋ|动词-ing形式|阅读
report|rɪˈpɔːt|名词|报告
rescuers|ˈreskjuːəz|名词|救援人员
rest|rest|动词|休息
returned|rɪˈtɜːnd|动词|返回了
river|ˈrɪvə|名词|河流
road|rəʊd|名词|马路
room|ruːm|名词|房间
rubbish|ˈrʌbɪʃ|名词|垃圾
safe|seɪf|形容词|安全的
safely|ˈseɪfli|副词|安全地
sang|sæŋ|动词|唱了
save|seɪv|动词|节约
school|skuːl|名词|学校
seeds|siːdz|名词|种子
send|send|动词|发送
sent|sent|动词|寄了
serious|ˈsɪəriəs|形容词|严重的
seven|ˈsevən|数词|七
shake|ʃeɪk|动词|摇晃
she|ʃiː|代词|她
shines|ʃaɪnz|动词|照耀
should|ʃʊd|情态动词|应该
shouted|ˈʃaʊtɪd|动词|喊了
showed|ʃəʊd|动词|展示了
sides|saɪdz|名词|面
sing|sɪŋ|动词|歌唱
sister|ˈsɪstə|名词|姐姐；妹妹
six|sɪks|数词|六
sky|skaɪ|名词|天空
sleeping|ˈsliːpɪŋ|动词-ing形式|睡觉
small|smɔːl|形容词|小的
smell|smel|系动词|闻起来
smells|smelz|系动词/动词|闻起来；闻
smiled|smaɪld|动词|笑了
snow|snəʊ|名词|雪
snowmen|ˈsnəʊmen|名词|雪人
snowstorm|ˈsnəʊstɔːm|名词|暴风雪
snowy|ˈsnəʊi|形容词|下雪的
so|səʊ|连词|所以
softly|ˈsɒftli|副词|轻轻地
some|sʌm|限定词|一些
song|sɒŋ|名词|歌曲
sounds|saʊndz|系动词|听起来
soup|suːp|名词|汤
speak|spiːk|动词|说话
spring|sprɪŋ|名词|春天
started|ˈstɑːtɪd|动词|开始了
stayed|steɪd|动词|待着了
stopped|stɒpt|动词|停止了
stops|stɒps|动词|停止
store|stɔː|动词|储存
story|ˈstɔːri|名词|故事
students|ˈstjuːdənts|名词|学生们
studying|ˈstʌdiɪŋ|动词-ing形式|学习
summer|ˈsʌmə|名词|夏天
sun|sʌn|名词|太阳
sunlight|ˈsʌnlaɪt|名词|阳光
sunny|ˈsʌni|形容词|晴朗的
sunset|ˈsʌnset|名词|日落
sweet|swiːt|形容词|香甜的
swim|swɪm|动词|游泳
take|teɪk|动词|带走；带上
talking|ˈtɔːkɪŋ|动名词|说话
task|tɑːsk|名词|任务
tastes|teɪsts|系动词|尝起来
taught|tɔːt|动词|教了
teacher|ˈtiːtʃə|名词|老师
temperature|ˈtemprətʃə|名词|气温
that|ðæt|连词|与前词连用：以便
the|ðə|冠词|这；那（定冠词）
them|ðem|代词|他们；它们
then|ðen|副词|然后
they|ðeɪ|代词|他们；它们
things|θɪŋz|名词|事物
this|ðɪs|限定词|这个
time|taɪm|名词|时间
to|tuː|介词/不定式标记|向；不定式标记
today|təˈdeɪ|副词|今天
together|təˈɡeðə|副词|一起
town|taʊn|名词|城镇
trees|triːz|名词|树木
tried|traɪd|动词|努力尝试了
turn|tɜːn|系动词|变成
under|ˈʌndə|介词|在……下面
us|ʌs|代词|我们（宾格）
use|juːz|动词|使用
visited|ˈvɪzɪtɪd|动词|参观了
visitors|ˈvɪzɪtəz|名词|游客；来访者
voices|ˈvɔɪsɪz|名词|人声
waited|ˈweɪtɪd|动词|等候了
waiting|ˈweɪtɪŋ|动词-ing形式|等候
walk|wɔːk|动词|行走
walked|wɔːkt|动词|行走了
walking|ˈwɔːkɪŋ|动词-ing形式|步行
warm|wɔːm|形容词|温暖的
warned|wɔːnd|动词|警告了
was|wɒz|助动词/系动词|过去时系动词或助动词（单数）
washing|ˈwɒʃɪŋ|动词-ing形式|清洗
watch|wɒtʃ|动词|观察
water|ˈwɔːtə|名词|水
we|wiː|代词|我们
weather|ˈweðə|名词|天气
welcome|ˈwelkəm|形容词|受欢迎的
went|went|动词|变成；去了
were|wɜː|助动词/系动词|过去时系动词或助动词（复数及第二人称）
wetlands|ˈwetləndz|名词|湿地
what|wɒt|疑问代词|什么
when|wen|连词|当……时
while|waɪl|连词|在……期间
wildlife|ˈwaɪldlaɪf|名词|野生动物
wind|wɪnd|名词|风
window|ˈwɪndəʊ|名词|窗户
windows|ˈwɪndəʊz|名词|窗户们
windy|ˈwɪndi|形容词|有风的
winter|ˈwɪntə|名词|冬天
with|wɪð|介词|带有；和
worked|wɜːkt|动词|工作了；努力了
working|ˈwɜːkɪŋ|动名词|工作
write|raɪt|动词|写
writing|ˈraɪtɪŋ|动词-ing形式|写
yellow|ˈjeləʊ|形容词|黄色的
yesterday|ˈjestədeɪ|副词|昨天
you|juː|代词|你；你们
your|jɔː|限定词|你的；你们的
zero|ˈzɪərəʊ|名词|零
`;
 const lexicon=Object.fromEntries(dictionary.trim().split('\n').map(row=>{const [key,...meta]=row.split('|');return [key,meta];}));
 const overrides={
  'The girl smells the flowers.':{smells:{ipa:'smelz',pos:'动词',zh:'闻',gloss:'闻'}},
  'The soup smells good.':{smells:{ipa:'smelz',pos:'系动词',zh:'闻起来',gloss:'闻起来'}},
  'We call the bird Snowy.':{snowy:{ipa:'ˈsnəʊi',pos:'专有名词',zh:'雪儿（鸟的名字）',gloss:'雪儿（鸟的名字）'}},
  'He tried to calm down.':{calm:{ipa:'kɑːm',pos:'动词',zh:'平静下来（calm down）',gloss:'平静下来'}},
  'The song makes me calm.':{calm:{ipa:'kɑːm',pos:'形容词',zh:'平静的',gloss:'平静的'}},
  'It was cold, so we closed the window.':{closed:{ipa:'kləʊzd',pos:'动词',zh:'关上了',gloss:'关上了'}},
  'I was writing a report when the lights went out, so I stopped working.':{went:{ipa:'went',pos:'动词',zh:'（灯）变得（与后词构成熄灭）',gloss:'（灯）变得（与后词构成熄灭）'},out:{ipa:'aʊt',pos:'副词',zh:'熄灭',gloss:'熄灭'}}
 };
 const notes={
  'In spring, flowers dance in the warm wind.':'dance把花朵随风摇摆写成跳舞，属于拟人。',
  'The poet describes winter trees as sleeping friends.':'as在这里意为“作为”；把冬树比作沉睡的朋友，是文学描写。',
  'Birds fly.':'fly是不及物动词，本句为主谓结构。',
  'Children fly kites in the park.':'fly在这里表示放飞，kites是宾语，in the park是地点状语。',
  'The girl smells the flowers.':'smells表示主动闻花，是及物动词；the flowers是宾语。',
  'The soup smells good.':'smells是系动词，good为形容词表语，不能改成well来修饰闻的动作。',
  'The weather in Beijing is cool and sunny today.':'主语是The weather in Beijing，cool和sunny是由and连接的两个形容词表语；today是时间状语。',
  'The teacher showed photos of wetlands to the students.':'改写双宾语后，photos of wetlands是宾语，to the students是介词短语；不是仍然并排的两个宾语。',
  'My friend made a birdhouse for me.':'make sth for sb表示为某人制作某物，此处用for而非to。',
  'We chose her our leader.':'our leader说明her的身份，是宾补，不是送给她的物品。',
  'We should keep the park clean and make visitors feel welcome.':'clean是宾补；make sb do结构中的feel welcome也是宾补，feel前不加to。',
  'Please speak quietly and take your rubbish away so that birds can live safely.':'quietly和safely分别修饰动作；so that引导目的从句。',
  'She sang as she walked.':'as连接同时发生的动作；没有必要只因出现as就把两个动作机械改为进行时。',
  'The story begins with a loud noise and ends with rescuers finding the boy.':'with后的rescuers finding the boy表示故事结束时的事件，不是救援指令。',
  'The airport was closed this morning.':'closed在此描述机场关闭的状态。',
  'At eight yesterday, we were having breakfast at home when the snowstorm began.':'were having说明当时正在吃早饭；began是其间发生的短动作。'
 };
 for(const unit of Object.values(units)){
  const tokens=new Set(unit.topics.flatMap(topic=>topic.sentences.flatMap(sentence=>(sentence.en.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]).map(word=>word.toLowerCase()))));
  unit.lexicon=Object.fromEntries([...tokens].map(key=>[key,lexicon[key]]));
  for(const topic of unit.topics)for(const sentence of topic.sentences){
   if(overrides[sentence.en])sentence.wordOverrides=overrides[sentence.en];
   if(notes[sentence.en])sentence.explanation=notes[sentence.en];
   // Resolve the frequent verb/adjective ambiguity from the explicit annotation.
   for(const [role,text] of sentence.groups){
    for(const word of text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]){
     const key=word.toLowerCase();
     if(key==='clean'||key==='closed'){
      const adjective=role==='宾补'||role==='表语';
      const meta=lexicon[key];
      (sentence.wordOverrides||(sentence.wordOverrides={}))[key]={ipa:meta[0],pos:adjective?'形容词':'动词',zh:key==='clean'?(adjective?'干净的':'清洁'):(adjective?'关闭的':'关上了'),gloss:key==='clean'?(adjective?'干净的':'清洁'):(adjective?'关闭的':'关上了')};
     }
    }
   }
  }
 }
 return units;
});
