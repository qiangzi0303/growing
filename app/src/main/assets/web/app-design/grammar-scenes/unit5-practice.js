/* Original error-focused exercises, not past-exam quotations. Stable question IDs are never reused for different questions. */
(()=>{
 const groups={};
 function add(lesson,id,title,rule,pitfall,rows){
  const questions=rows.map(([prompt,choices,explanation],i)=>{
   const source=choices.split('|'),shift=i%source.length,options=source.slice(shift).concat(source.slice(0,shift));
   return {id:lesson+'-'+id+'-'+String(i+1).padStart(2,'0'),prompt,options,answer:options.indexOf(source[0]),explanation,level:i<6?'基础':i<8?'提高':i===8?'难题':'综合应用',source:'原创易错题'};
  });
  (groups[lesson]||=[]).push({id,title,rule,pitfall,questions});
 }
 add('reading','growth','成长时间线','按时间词整理同一个体的变化，不能把个体情况扩大到所有熊猫。','希望的成长经历，不等于所有野生熊猫都安全。',[
  ['哪组词最适合提示成长的先后顺序？','at birth → later → finally|because → so → therefore|but → however → although','时间词帮助整理先后；另外两组表示因果和转折。'],
  ['At birth, the panda was tiny. 这句话描述哪个阶段？','刚出生时|成年后|回归自然后','at birth 表示出生时，不是长大后。'],
  ['First the keeper fed the cub. Then it fell asleep. 哪件事先发生？','饲养员喂幼崽|幼崽睡着|两件事同时发生','first 引出先发生的事，then 引出后发生的事。'],
  ['The cub grew bigger as it got older. 文中变化的是？','幼崽的体形|保护区的位置|竹子的颜色','grew bigger 描述体形变化。'],
  ['要找某只熊猫的成长经历，最该关注哪类信息？','时间和相应变化|全文所有形容词|作者用了多少逗号','时间与变化共同构成成长线。'],
  ['“希望现在很健康”可以直接证明哪项？','希望这个个体目前健康|所有野生熊猫都健康|熊猫不再需要保护','个体证据只能直接支持这个个体的结论。'],
  ['材料：At first, the cub needed milk. Later, it began to eat bamboo. 最准确的概括是？','这只幼崽的食物随成长发生变化|所有熊猫出生就吃竹子|成年熊猫只喝奶','两句比较同一个体不同阶段，不能扩大成所有阶段的规律。'],
  ['材料先写一只熊猫的成长，再写野外栖息地减少。哪种笔记最好？','分列“个体成长线”和“野外保护问题”|把栖息地减少记成这只熊猫的年龄|删去成长部分，只留结论','叙述对象与组织方式不同，需要分清。'],
  ['材料：By October the cub could walk. Earlier, in August, it could only crawl. 按实际时间应如何排序？','八月爬行 → 十月行走|十月行走 → 八月爬行|两项同时发生','文章先提十月，不代表十月发生在八月前；要按日期排序。'],
  ['阅读记录：一月很小；六月长大；另段说野外竹林减少。哪份总结有依据？','幼崽在成长；野外熊猫仍面临栖息地问题|幼崽长大说明竹林正在增加|竹林减少说明所有幼崽都没长大','两条信息各自成立，不能据此捏造因果或全体结论。']
 ]);
 add('reading','habitat','食物与困境','live on 表示以……为食；as a result 后面接前述原因带来的结果。','不要把“因此”后面的结果当成原因，也不要把 live on 当作“住在”。',[
  ['Pandas live mainly ___ bamboo.','on|in|at','live on 表示以某种食物为生。'],
  ['Pandas live mainly on bamboo. 这句主要说明？','熊猫的主要食物|熊猫的出生地点|熊猫的年龄','on bamboo 在 live on 搭配中说明食物。'],
  ['The forest became smaller. As a result, the animals had less food. 原因是？','森林变小|动物食物减少|动物体重增加','as a result 前的森林变小是这里的原因。'],
  ['上一题中，as a result 后的 less food 属于？','结果|保护措施|时间标志','as a result 引出结果。'],
  ['Pandas live ___ forests and live ___ bamboo.','in; on|on; in|at; to','live in forests 是住在森林，live on bamboo 是以竹子为食。'],
  ['竹林减少，最直接可能影响熊猫的什么？','食物和生活空间|英语发音|海水深度','竹林与熊猫的食物和栖息地相关。'],
  ['材料：People cut down trees. As a result, some birds lost their homes. 哪项未被说明？','所有鸟都已经死亡|部分鸟失去家园|有人砍伐树木','失去家园不等于材料已经证明所有鸟死亡。'],
  ['哪句准确表达“食物减少是森林缩小的结果”？','The forest became smaller. As a result, there was less food.|There was less food. As a result, the forest became smaller.|The forest became smaller because there was less food.','后两项倒置了题目给出的因果关系。'],
  ['某段只有“竹林减少，熊猫找食物更困难”。哪项推断最稳妥？','保护竹林可能有助于缓解食物问题|保护竹林能立即解决所有问题|只要有一片竹林就无需其他措施','证据支持相关措施可能有帮助，不支持绝对化的全部结论。'],
  ['要把“竹林减少→食物不足→保护栖息地”整理成问题与对策，应选？','原因：竹林减少；问题：食物不足；对策：保护栖息地|原因：保护栖息地；对策：食物不足|问题：保护栖息地；结果：建立法律','先厘清因果，再把对策对应到问题。']
 ]);
 add('reading','protection','措施与变化','把具体保护措施与问题对应起来；thanks to 表示多亏，thanks for 表示感谢。','thanks to 不等于 thanks for；采取行动也不等于所有问题已经解决。',[
  ['Thanks ___ the keepers, the cub is healthier now.','to|for|with','thanks to 引出带来积极变化的人或事。'],
  ['Thanks ___ looking after the cub.','for|to|at','感谢对方做某事用 thanks for doing。'],
  ['We should take ___ to protect wildlife.','action|acting|active','take action 是固定搭配，表示采取行动。'],
  ['哪项属于保护措施？','建立自然保护区|缩小竹林|捕猎野生动物','建立保护区是保护措施，后两项会带来威胁。'],
  ['“保护区”主要对应哪类问题？','野生动物的栖息地受到威胁|教室灯太亮|学生拼写错误','措施要与需要解决的问题相对应。'],
  ['Thanks to the new law, fewer people hunt animals. 积极变化是？','猎捕动物的人更少|已经完全没有猎捕|新法律不再需要','fewer 是更少，并非一个也没有。'],
  ['选出两处都正确的表达：___ your help, we finished. ___ helping us!','Thanks to; Thanks for|Thanks for; Thanks to|Thanks to; Thanks to','第一处说明完成的原因，第二处直接表达感谢。'],
  ['材料只说“保护措施使情况改善”。哪种复述最准确？','措施有帮助，但不能据此断言问题全消失|野生动物从此不再需要保护|保护措施毫无作用','改善既不等于彻底解决，也不等于没有作用。'],
  ['某保护区扩大后，熊猫数量增加。仅凭这两条信息，哪句最严谨？','数量增加与保护行动同时出现，仍需证据判断全部原因|数量增加一定完全由这一措施造成|任何地区扩大保护区都会立刻增加同样数量','不能从先后或同时出现直接推出唯一原因和普遍效果。'],
  ['竹林减少、非法捕猎仍存在，哪组方案最有针对性？','保护栖息地并执行禁猎法律|只写“动物很可爱”|只给一只熊猫取名','两项措施分别对应栖息地和捕猎问题。']
 ]);
 add('verb-to','plan','动词 + to do','plan / hope / decide / agree / learn 后可接 to + 动词原形。','to 后用原形；这里说明计划或决定的内容，不代表事情已完成。',[
  ['They plan ___ the reserve tomorrow.','to visit|visiting|visited','plan to do；tomorrow 说明是计划，不是已完成。'],
  ['I hope ___ a wildlife keeper.','to become|becoming|became','hope to do。'],
  ['She decided ___ the cub.','to help|helping|helps','decide 后用 to help。'],
  ['We agreed ___ early.','to leave|leaving|left','agree to do。'],
  ['The children are learning ___ the animals.','to care for|cared for|cares for','learn to do；to 后使用动词原形。'],
  ['He plans to ___ a poster.','make|makes|making','plans 中的第三人称单数变化不影响 to 后的原形。'],
  ['She decided ___ yesterday, but she has not gone yet.','to go|went|going','昨天作了决定，决定的内容仍用 to go；不能因 yesterday 就把空格写成过去式。'],
  ['We hope to see pandas. 这句话是否表明已经看到熊猫？','不表明，只表达希望|表明已经看到|表明永远看不到','hope to do 描述希望，并不保证动作已经实现。'],
  ['They planned to open the reserve in May, but it opened in July. 哪项正确？','五月是原计划，七月是实际开放时间|五月和七月都实际开放了一次|计划句证明五月已经开放','区分计划的内容与实际发生的事实。'],
  ['社团“决定参观并希望学习”，哪句两处搭配都对？','We decided to visit the reserve and hoped to learn more.|We decided visiting the reserve and hoped to learn more.|We decided to visit the reserve and hoped learning more.','decide 和 hope 在这里都接 to do。']
 ]);
 add('verb-to','negative','not to do','否定不定式：not 放在 to 前，表示决定不做某事。','decided not to go（决定不去）与 did not decide to go（没决定要去）不同。',[
  ['We decided ___ the birds.（不打扰）','not to disturb|not disturb|to not disturbing','标准否定不定式是 not to disturb。'],
  ['She agreed ___ the secret.（不说）','not to tell|not telling|does not tell','agree not to do。'],
  ['They plan ___ rubbish here.（不留下）','not to leave|not left|not leaving','plan not to do；to 后用原形。'],
  ['He decided not to ___ the tree.','cut|cuts|cutting','not to 后仍用动词原形。'],
  ['She decided not to go. 意思是？','她决定不去|她没有决定是否去|她决定去了又回来','否定的是 go，而不是 decided。'],
  ['哪句正确表达“我们决定不捕猎”？','We decided not to hunt.|We decided do not hunt.|We decided not hunting.','不定式内部用 not to do，不使用完整句子的 do not。'],
  ['“没作出去的决定”和“作出了不去的决定”应分别用？','did not decide to go; decided not to go|decided not to go; did not decide to go|两者完全没有区别','not 所在位置改变了被否定的部分。'],
  ['改错：They agreed not to feeding the animals. 应改哪处？','feeding → feed|not → no|agreed → agreeing','to 是不定式标记，后接 feed 原形。'],
  ['Leo decided not to join. Mia did not decide to join. 能确定谁作出了“不参加”的决定？','Leo|Mia|两人都能确定','Leo 明确决定不参加；Mia 的句子只说没有作出参加的决定。'],
  ['活动要求“决定不投喂，并同意不大声说话”，哪句正确？','We decided not to feed animals and agreed not to speak loudly.|We decided do not feed animals and agreed not to speak loudly.|We decided not feeding animals and agreed not speaking loudly.','两处均用动词 + not to do。']
 ]);
 add('verb-to','ing','to do 还是 doing','先看前面的动词：enjoy / finish + doing；plan / decide + to do。','不能把所有“做某事”都写成 to do，也不能因前面是过去式就把后面写成过去式。',[
  ['We enjoy ___ birds.','watching|to watch|watch','enjoy doing。'],
  ['She finished ___ the report.','writing|to write|write','finish doing。'],
  ['He plans ___ photos tomorrow.','to take|taking|takes','plan to do，不能套用 enjoy 的规则。'],
  ['They enjoyed ___ about pandas.','learning|to learn|learned','enjoyed 的时态不改变后面用 doing 的搭配。'],
  ['I have finished ___ the book.','reading|to read|read','完成时也使用 finish doing。'],
  ['哪一组前后搭配正确？','decide to go; enjoy going|decide going; enjoy to go|decide to going; enjoy go','decide 接不定式；enjoy 接动名词。'],
  ['She plans ___ the zoo and enjoys ___ animals.','to visit; watching|visiting; to watch|to visit; to watch','两个空须分别依据 plans 和 enjoys 判断。'],
  ['We finished ___ and decided ___.','working; to rest|to work; resting|working; resting','finish doing；decide to do。'],
  ['哪句两个并列成分都符合搭配？','I enjoy reading and drawing.|I enjoy reading and to draw.|I enjoy to read and drawing.','两个并列活动共同受 enjoy 支配，都用 doing。'],
  ['完成海报后计划去保护区，哪句正确？','We finished making the poster and planned to visit the reserve.|We finished to make the poster and planned visiting the reserve.|We finished making the poster and planned visited the reserve.','先完成的活动用 finish doing；后面的计划用 plan to do。']
 ]);
 add('purpose','action','动作与目的','先找“做了什么”，再找“为什么做”；两部分不能混为一谈。','句尾的不定式可能说明目的，但主句动作也要辨认准确。',[
  ['We went to the park to watch birds. 主要动作是？','went to the park|to watch birds|birds','主句说去了公园；看鸟是去公园的目的。'],
  ['She reads books to learn about wolves. 为什么读书？','为了了解狼|为了把书变成狼|因为她已经写完书','to learn… 说明读书的目的。'],
  ['We put up a poster. 这句话直接回答？','做了什么|为什么做|结果一定是什么','没有提供目的成分，只说明行动。'],
  ['They built a reserve to protect animals. 哪部分是目的？','to protect animals|built a reserve|They','to protect animals 解释建保护区的目的。'],
  ['“为什么去森林？”对应哪个英文疑问词？','Why|When|Where','why 问原因或目的，when 问时间，where 问地点。'],
  ['We went there to help. “去那里”和“帮助”的关系是？','行动与目的|两个人的姓名|两个完全无关的时间','去那里是行动，帮助是目的。'],
  ['To learn more, she joined the club. 主要动作在哪？','she joined the club|To learn more|more','目的放句首也不会变成主要谓语动作。'],
  ['We visited the reserve to study pandas. 哪组问答与句意一致？','What did we do? We visited the reserve.|Why did we visit? To visit the reserve.|When did we visit? To study pandas.','第二项重复动作而没解释目的；第三项用目的回答时间。'],
  ['She hurried to the station to catch the train, but missed it. 哪项正确？','赶往车站是动作，赶上火车是未实现的目的|to catch 证明已经赶上火车|missed 说明她没有去车站','目的可以未实现，不能当作已发生的结果。'],
  ['为“读资料了解动物→制作海报传播知识”配两组动作与目的，应选？','read information → learn about animals; make posters → inform people|learn about animals → make food; make posters → sleep|read information → build roads; inform people → lose homes','每个目的都要与相应行动合理关联。']
 ]);
 add('purpose','why','to do 表目的','表示“为了……”时用 to + 动词原形，回答 why。','不要把过去时或 -ing 当作这里的目的不定式；目的也不等于已实现的结果。',[
  ['We went to the forest ___ birds.（为了观察）','to watch|watched|watching','to watch 表达去森林的目的。'],
  ['She works hard ___ animals.','to help|helped|helping','to help 说明努力的目的。'],
  ['They raised money ___ a new home for the cub.','to build|built|building','to build 回答筹款是为了什么。'],
  ['We use a camera ___ photos.','to take|took|taking','用相机的目的是拍照。'],
  ['He got up early ___ the bus.','to catch|caught|catches','to catch 表达早起的目的，原形不随主语变化。'],
  ['We opened the book to learn more. to learn more 回答？','Why did we open it?|Who opened it?|When did we open it?','这里是不定式作目的状语。'],
  ['哪句的 to help 表目的，而不是计划内容？','We worked together to help animals.|We planned to help animals.|We decided to help animals.','第一句解释一起工作的目的；后两句补充计划、决定的内容。'],
  ['We went there yesterday ___ the keeper.','to meet|met|meeting','yesterday 决定主句时态，不把表示目的的 to meet 改成过去式。'],
  ['We ran to catch the bus, but it had left. 能推出什么？','赶车是目的，但没有赶上|已经赶上车|没有跑步','后半句明确说明车已离开，目的并未实现。'],
  ['志愿者张贴海报是为了传播保护知识，哪句最完整准确？','They put up posters to tell people how to protect wildlife.|They put up posters told people how to protect wildlife.|They put up posters to telling people how to protect wildlife.','主句说明行动，to tell 说明目的；to 后用原形。']
 ]);
 add('purpose','front','目的放句首','To do… 可以放在句首，后接主句；位置变了，表达的目的不变。','句首的 to do 不是主句谓语；不要漏掉后面的主句。',[
  ['___ animals, we build reserves.','To protect|Protected|Protects','句首用 To protect 表达建保护区的目的。'],
  ['To learn more, we read books. 主句是？','we read books|To learn more|more','主句有主语 we 和谓语 read。'],
  ['哪句标点最清楚地分开句首目的与主句？','To help birds, we planted trees.|To, help birds we planted trees.|To help, birds we planted trees.','逗号放在完整目的短语后。'],
  ['We read books to learn more. 换成句首目的后是？','To learn more, we read books.|To read books, we learn more.|Learn more to, we read books.','只移动目的短语，不能颠倒动作与目的。'],
  ['To ___ time, we took a taxi.','save|saved|saving','不定式的 to 后用原形。'],
  ['“To protect pandas.” 单独写在正式文章中，最明显的问题是？','这里只有目的短语，缺少主句|to 后不能用 protect|pandas 不能用复数','作为完整陈述句还需补充谁做了什么。'],
  ['哪句与 We raised money to build a reserve 含义一致？','To build a reserve, we raised money.|To raise money, we built a reserve.|To build money, we raised a reserve.','建保护区是目的，筹款是行动。'],
  ['To watch birds, the children went to the lake. 谁是看鸟的人？','the children|the lake|没有人','此处目的动作的执行者与主句主语一致。'],
  ['哪句最清楚地避免“书本自己学习”的错误关系？','To learn about pandas, we read this book.|To learn about pandas, this book is useful.|To learn about pandas, a picture is colourful.','目的动作 learn 的执行者应明确是 we。'],
  ['请选完整且目的关系合理的倡议句。','To protect wildlife, we should keep rivers clean.|To protect wildlife, rivers should learn rules.|To protect wildlife.','第一句有完整主句，且清洁河流与保护动物的目标合理相连。']
 ]);
 add('object-to','ask','ask / tell sb to do','ask / tell / want / invite + 人 + to do；否定用 人 + not to do。','否定要求是 ask sb not to do，不是 ask sb do not…。',[
  ['The keeper asked us ___ quietly.','to wait|wait|waiting','ask sb to do。'],
  ['They told us ___ the birds.（不要打扰）','not to disturb|do not disturb|not disturbing','tell sb not to do。'],
  ['I want him ___ the club.','to join|join|joining','want sb to do。'],
  ['We invited her ___ the reserve.','to visit|visit|visiting','invite sb to do。'],
  ['Mum asked ___ to help.','me|I|my','asked 后的对象用宾格 me。'],
  ['She told us not to ___ the animals.','feed|fed|feeding','not to 后仍接原形 feed。'],
  ['改错：The guide asked us do not shout. 应改为？','asked us not to shout|asked not us shout|asked us not shouting','否定不定式置于宾语 us 之后。'],
  ['The teacher asked Tom to help Jack. 被要求帮助别人的是？','Tom|Jack|The teacher','Tom 是 asked 的宾语，也是 help 的执行者。'],
  ['“我没要求他离开”与“我要求他别离开”分别是？','I did not ask him to leave; I asked him not to leave.|I asked him not to leave; I did not ask him to leave.|两句含义完全一样','前句否定要求行为，后句是明确要求留下。'],
  ['导游要求大家安静等待，不要投喂。哪句正确？','The guide asked us to wait quietly and not to feed animals.|The guide asked us wait quietly and do not feed animals.|The guide asked we to wait quietly and not feeding animals.','us 用宾格；肯定、否定要求分别用 to wait 和 not to feed。']
 ]);
 add('object-to','make','make / let sb do','主动结构 make / let + 人 + 动词原形，不带 to。','made 是过去式，后面的动作仍用原形；不要和 ask sb to do 混淆。',[
  ['The funny panda made us ___.','laugh|to laugh|laughed','主动 make sb do。'],
  ['Please let me ___.','try|to try|trying','let sb do，原形前不带 to。'],
  ['His words made her ___ again.','think|to think|thought','made 后的宾补用原形 think。'],
  ['The coach made ___ run.','him|he|his','make 后的人用宾格 him。'],
  ['She let the children ___ outside.','play|to play|played','let sb do，不能因叙述过去就用 played。'],
  ['哪句主动搭配正确？','The teacher made us read.|The teacher made us to read.|The teacher made we reading.','make us read；us 是宾格，read 是原形。'],
  ['The teacher asked us ___, then made us ___ again.','to write; write|write; to write|to write; to write','ask 带 to；主动 make 不带 to。'],
  ['He made me clean the room yesterday. 哪个动作承担了过去时变化？','made|clean|room','made 是谓语过去式，clean 作为宾补用原形。'],
  ['“老师允许我走”和“老师要求我留下”，哪组结构都对？','let me leave; made me stay|let me to leave; made me stay|let me leave; made me to stay','let 和主动 make 后都接不带 to 的原形。'],
  ['活动中老师先请大家安静，再让大家读规则。哪句正确？','The teacher asked us to be quiet and made us read the rules.|The teacher asked us be quiet and made us to read the rules.|The teacher asked us to be quiet and made us reading the rules.','分别依据 ask sb to do 与 make sb do 判断。']
 ]);
 add('object-to','passive','be made to do','make sb do 变成被动后：人 + be made to do，补回 to。','不能保留主动省略 to 的写法；be 的形式要与主语和时态匹配。',[
  ['We were made ___ the room.','to clean|clean|cleaning','被动 be made to do。'],
  ['I was made ___ the rules.','to read|read|reading','was made 后要补回 to。'],
  ['They ___ made to wait yesterday.','were|was|is','they 和过去时间搭配 were。'],
  ['He was made to ___ early.','leave|left|leaves','to 后用原形 leave。'],
  ['主动 The boss made me work 对应的被动是？','I was made to work.|I was made work.|Me was made to work.','me 变主语 I，补 was 和 to。'],
  ['哪句漏了被动结构里的 to？','She was made stay.|She was made to stay.|They made her stay.','第一句应为 was made to stay；第三句是正确主动句。'],
  ['They made him ___; he was made ___.','wait; to wait|to wait; wait|wait; wait','主动省 to，被动还原 to。'],
  ['“学生每天被要求读书”，哪句主谓一致？','The students are made to read every day.|The students is made to read every day.|The students are made read every day.','复数 students 配 are，且被动保留 to。'],
  ['The teacher made Tom help Jim. 改被动后，哪句保留了原意？','Tom was made to help Jim by the teacher.|Jim was made to help Tom by the teacher.|Tom was made help Jim by the teacher.','原宾语 Tom 变主语，帮助对象 Jim 不变，help 前补 to。'],
  ['昨天老师要求我们重写海报。选出主动、被动都正确的一组。','The teacher made us rewrite it. / We were made to rewrite it.|The teacher made us to rewrite it. / We were made to rewrite it.|The teacher made us rewrite it. / We were made rewrite it.','主动 make us rewrite；被动 were made to rewrite。']
 ]);
 add('object-to','help','help sb (to) do','help + 人 + do 或 to do 都可以，to 可省略。','题目不能把 help sb do 和 help sb to do 同时当成单选题的两个唯一答案。',[
  ['She helped me ___ the bag.（选不带 to 的形式）','carry|carrying|carried','help sb do 可省略 to。'],
  ['She helped me ___ the bag.（选带 to 的形式）','to carry|to carrying|to carried','help sb to do 也成立，to 后用原形。'],
  ['help sb clean 与 help sb to clean，哪项正确？','两种都正确|只有前者正确|只有后者正确','help 的 to 可以保留或省略。'],
  ['We helped ___ to build a shelter.','them|they|their','help 后的对象用宾格 them。'],
  ['He helped us to ___ the rules.','understand|understood|understanding','to 后接原形 understand。'],
  ['哪项不符合本课“帮助某人做”结构？','helped me carrying|helped me carry|helped me to carry','help sb doing 不是这里的标准结构。'],
  ['The story made me ___ and helped me ___ the problem. 选两空均正确的一项。','think; to understand|to think; understand|thinking; understanding','make 主动不带 to；help 后可以带 to。'],
  ['单选题只有 help him do 与 help him to do 两个选项、无特殊限制，问题在哪？','两个选项都符合该结构|两个选项都错|必须按选项长度判断','help 后的 to 可选，不能强行只判其中一个对。'],
  ['He helped me to read and understand the notice. 哪个分析正确？','read 与 understand 共用前面的 to|understand 必须改为 understood|help 后有 to 所以整句错误','并列动词可以共用不定式标记 to。'],
  ['志愿者帮助孩子了解规则，并让他们保持安静。哪句正确？','They helped children to learn the rules and made them keep quiet.|They helped children learning the rules and made them to keep quiet.|They helped children to learned the rules and made them keeping quiet.','help 可带 to；make 主动不带 to，后面都用原形。']
 ]);
 add('object-to','see-do','see sb do','see / hear sb do 可强调全过程，或语境中经常发生的动作。','主动结构中不加 to；不要把“完整过程”理解成 do 本身永远表示过去。',[
  ['从走上桥到走下桥都看见了，要突出全过程：I saw him ___ the bridge.','cross|to cross|crossed','see sb do 表达这里的全过程；时态由 saw 承担。'],
  ['从歌曲开头听到结尾：I heard her ___ the song.','sing|to sing|sang','hear sb do 可强调听到完整过程。'],
  ['I saw ___ enter the room.','him|he|his','see 后的人用宾格 him。'],
  ['I often see her ___ in the park.（强调经常发生的活动）','run|to run|ran','see sb do 可用于经常看到某动作。'],
  ['Which is correct?','I saw the bird fly away.|I saw the bird to fly away.|I saw the bird flew away.','主动 see sb do，不用 to 或谓语过去式。'],
  ['I saw him cross the bridge. 哪个词表示看见发生在过去？','saw|cross|bridge','过去时由 saw 表达，cross 用原形。'],
  ['从打开门、走入到关门都看到，哪个表达更强调完整进入动作？','I saw him enter the room.|I saw him entering the room.|I saw him to enter the room.','enter 更强调完整事件；entering 强调观察时进行中。'],
  ['“我经常听她唱歌”应选？','I often hear her sing.|I often hear her to sing.|I often hear she sing.','often 给出经常发生的语境；her 用宾格。'],
  ['“I saw him cross.”与“I saw him crossing.”都可能正确，这说明？','形式选择与表达重点有关|crossing 必然说明他最终失败|两者在任何语境下意思完全一样','do 与 doing 的观察重点不同，不能据 doing 推出最终失败。'],
  ['你看见鸟从笼中飞出直至飞远，想突出完整飞离过程，哪句最佳？','I saw the bird fly away.|I saw the bird to fly away.|I saw the bird flew away.','saw + 宾语 + 原形 fly，强调完整事件。']
 ]);
 add('object-to','see-doing','see sb doing','see / hear sb doing 强调看到或听到时动作正在进行。','doing 不表示动作最终没完成，也不保证看到了开始和结束。',[
  ['走到窗边时，他正过桥：I saw him ___ the bridge.（强调正在）','crossing|to cross|crossed','强调观察时正在进行，用 doing。'],
  ['When I passed her room, I heard her ___.（强调正在唱）','singing|to sing|sang','hear sb doing 强调听到时进行中。'],
  ['I saw ___ running.','her|she|hers','see 后的对象用宾格 her。'],
  ['I saw him swimming. 这句本身表明？','看到时他正在游泳|他最终一定没游完|我一定看了全部过程','doing 只突出观察时正在进行。'],
  ['saw 的后面哪项能表达“看见孩子正在玩”？','the children playing|the children to playing|the children played','see sb doing；不能用 to doing 或过去式作该宾补。'],
  ['“看见时正在写字”的结构是？','see sb writing|see sb to write|see sb wrote','这里强调进行，用 writing。'],
  ['路过操场，只想强调当时他们正在踢球：I saw them ___.','playing football|to play football|played football','playing 突出观察时的活动。'],
  ['I heard her singing, but I left before the song ended. 哪项正确？','我听到她唱歌中途的一段|她一定从未唱完歌|我听到了整首歌结尾','我提前离开，只说明没听到结尾，不说明她最终没唱完。'],
  ['证据只有 I saw him crossing the bridge。哪项不能据此确定？','他后来是否走到了对岸|观察时他正在过桥|观察者看到了他','doing 不交代后来结果。'],
  ['两位同学分别描述全过程与当时正在发生，哪组正确？','I saw him cross the bridge. / I saw him crossing the bridge.|I saw him to cross the bridge. / I saw him crossing the bridge.|I saw him crossed the bridge. / I saw him to crossing the bridge.','第一句 do 强调完整事件，第二句 doing 强调进行中。']
 ]);
 add('writing','danger','in danger / dangerous','in danger 是“处于危险中”；dangerous 是“有危险性的”。','两者描述不同：受到威胁，不等于会伤害别人。',[
  ['Some animals are in ___.','danger|dangerous|dangerously','介词短语 in danger 使用名词。'],
  ['It is ___ to swim here.','dangerous|danger|endanger','is 后在这里用形容词 dangerous。'],
  ['The panda is in danger. 意思是？','熊猫正受到威胁|熊猫一定会攻击人|熊猫正在睡觉','in danger 描述自身处境危险。'],
  ['A dangerous animal 表示？','有危险性的动物|只指濒危动物|安全的动物','dangerous 描述动物可能带来的危险性。'],
  ['We must help animals ___ danger.','in|on|to','固定短语 in danger。'],
  ['改错：Their home is in dangerous. 应改为？','in danger|in dangerously|on dangerous','in danger 是表示处境的短语。'],
  ['The animal is ___, and its home is in ___.','dangerous; danger|danger; dangerous|dangerously; dangerous','前面需形容词，in 后的固定搭配用名词。'],
  ['“这只动物有危险性”能否证明它“没有受到威胁”？','不能，两种情况可以同时存在|能，危险的动物不需要保护|能，只要危险就没有天敌','自身危险性与所处环境是否安全是不同维度。'],
  ['材料：某动物能伤人，且正因栖息地减少而生存受威胁。哪句准确？','It is dangerous and also in danger.|It is dangerous, so it cannot be in danger.|It is in danger, so it cannot hurt anyone.','两种描述可以同时成立，不能相互否定。'],
  ['倡议想说“动物的家园处于危险中，污染是危险的”，哪句正确？','Their homes are in danger. Pollution is dangerous.|Their homes are in dangerous. Pollution is danger.|Their homes are dangerous. Pollution is in dangerous.','区分名词短语 in danger 和表性质的形容词 dangerous。']
 ]);
 add('writing','action','提出具体行动','按“动物特点 → 面临的问题 → 对应行动”写倡议。','“我喜欢动物”表达态度，但不能替代明确可执行的措施。',[
  ['哪句提出了具体保护行动？','Keep rivers clean.|I like animals.|Animals are interesting.','保持河流清洁是行动，另两项是态度或评价。'],
  ['野生动物家园被破坏，哪项措施更对应问题？','Protect their habitats.|Write only their names.|Count classroom chairs.','保护栖息地直接对应家园破坏。'],
  ['河流污染威胁动物，优先提出什么？','Reduce pollution in rivers.|Catch more wild animals.|Make rivers dirtier.','减少污染针对题设威胁。'],
  ['哪种倡议结构最清晰？','特点 → 危险 → 行动|行动 → 无关笑话 → 日期|只重复“动物很好”','先介绍对象与问题，再提出行动。'],
  ['Let’s ___ their homes.','protect|to protect|protecting','let us do；Let’s 后接原形。'],
  ['“Take action”在倡议中表示？','采取行动|只观看表演|停止思考','take action 强调付诸行动。'],
  ['哪句比“Do something good”更具体？','Do not leave rubbish by the river.|Animals are good.|We need something.','明确地点和行为，读者知道如何做。'],
  ['倡议前文讲食物不足，后文只说“动物很漂亮”。最需要补什么？','针对食物或栖息地问题的措施|再加三个表示漂亮的词|删掉所有问题','行动段应回应前面提出的困难。'],
  ['“投喂任何野生动物都能保护它们”作为建议有什么问题？','过于绝对，可能有害，应遵守专业管理要求|只要用了 protect 就一定正确|没有使用形容词所以错误','保护建议要合理、具体，不以好心代替适当措施。'],
  ['某倡议主题是河流污染威胁野生动物，哪段最完整？','Wild animals need clean water. Pollution threatens them. Let’s keep rubbish out of rivers.|Animals are nice. I like them. They are nice.|Let’s catch animals. Clean water is unnecessary.','特点、问题、行动前后呼应，措施针对污染。']
 ]);
 add('writing','forms','构词与词形','kind → kindness；action / protection 为名词。结合句子选择词形。','后缀不是万能公式；看到 -ing 也不能一概当成正在进行。',[
  ['kind 的名词形式是？','kindness|kindly|kinding','kind + -ness 构成 kindness，表示善良。'],
  ['Thank you for your ___.','kindness|kind|kindly','your 后在这里需要名词 kindness。'],
  ['We should take ___.','action|active|actively','take action 中 action 是名词。'],
  ['Wildlife ___ is important.','protection|protect|protective','主语短语需要名词 protection。'],
  ['She is very ___ to animals.','kind|kindness|kindly','is 后表示品质用形容词 kind。'],
  ['A satisfying result 中 satisfying 的作用是？','修饰 result 的形容词|表示 result 正在做动作的谓语|表示时间的名词','-ing 形式在这里作形容词，意为令人满意的。'],
  ['Her ___ led her to take ___.','kindness; action|kind; active|kindly; act','her 后需要表示品质的名词；take action 是固定搭配。'],
  ['哪种构词方法最可靠？','记住已核对词形，并结合句子检查|任何形容词都可以随意加 -ion|任何动词加 -ness 都成正确名词','构词有规律也有限制，不能机械加后缀。'],
  ['The result was satisfying. She was watching birds. 两个 -ing 的作用是？','前者表性质；后者与 was 构成过去进行时|两者都一定表示过去进行时|两者都是名词','要看句意和结构，不能只按词尾判断。'],
  ['“善良应化为行动，野生动物保护很重要”，哪句词形都对？','Kindness should lead to action. Wildlife protection is important.|Kind should lead to active. Wildlife protect is important.|Kindly should lead to actively. Wildlife protective is important.','品质、行动、保护在这些位置都需要名词。']
 ]);
 function point(lesson,id){return groups[lesson]?.find(p=>p.id===id);}
 function validate(p,r){
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  if(!object(r)||r.version!==1||!Number.isInteger(r.index)||r.index<0||r.index>=p.questions.length||!object(r.answers)||!Number.isInteger(r.best)||r.best<0||r.best>p.questions.length)throw Error('要点练习记录格式无法识别，原记录已保留');
  for(const [id,a] of Object.entries(r.answers)){const q=p.questions.find(q=>q.id===id);if(!q||!object(a)||!Number.isInteger(a.choice)||a.choice<0||a.choice>=q.options.length||typeof a.checked!=='boolean')throw Error('练习答案与题目不匹配，原记录已保留');}
  return r;
 }
 const score=(p,r)=>p.questions.filter(q=>r.answers[q.id]?.checked&&r.answers[q.id].choice===q.answer).length;
 window.GrowingUnit5Practice={groups,point,validate,score,empty:()=>({version:1,index:0,answers:{},best:0})};
})();
