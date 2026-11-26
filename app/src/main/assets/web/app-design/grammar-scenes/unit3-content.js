/* Original error-focused practice based on the existing Unit 3 knowledge cards. */
(()=>{
 const lessons={};
 const add=(lesson,tab,p)=>{(lessons[lesson]||={tab,points:[]}).points.push(p);};
 add('patterns','重点短语与句型',{id:'purpose-method',title:'目的与方法',rule:'in order to do 说明目的；by doing 说明方法。',pitfall:'in order to 后用原形；by 是介词，后用 doing。',sentence:'I improve my English by reading aloud in order to speak more clearly.',translation:'我通过朗读提高英语，为的是说得更清楚。',explain:'先看行动“朗读”，再问怎样提高（by reading），最后问为何提高（in order to speak）。',animation:{kind:'sequence',actors:['学习者'],labels:['朗读 reading','方法 by doing','目的 to speak']},rows:[
 ['I read aloud in order to ___ my pronunciation.','improve|improving|improved','in order to 后接动词原形，表示目的。'],
 ['He learns new words by ___ sentences.','reading|read|to read','by 是介词，后接 reading。'],
 ['in order to learn 在句中主要说明什么？','目的|方法|已经完成的结果','它回答“为了什么”，不表示一定已经学会。'],
 ['by talking to local people 主要说明什么？','方法|日期|目的地','by doing 回答“通过什么方法”。'],
 ['She listens carefully in order ___ understand.','to|for|by','完整结构是 in order to do。'],
 ['Franklin taught himself ___ reading a lot.','by|in order to|to','reading 是动名词，这里用 by 表方法。'],
 ['He practises ___ speaking with friends ___ improve fluency.','by; in order to|in order to; by|by; by','第一空引出方法，第二空引出目的。'],
 ['哪句同时准确表达“通过朗读”和“为了进步”？','I learn by reading aloud in order to improve.|I learn by read aloud in order to improve.|I learn by reading aloud in order to improving.','by reading 与 in order to improve 各自采用正确形式。'],
 ['Sam read aloud in order to win, but he did not win. 哪项有依据？','赢是目的，但目的没有实现|他既然有目的就一定赢了|朗读从来没有帮助','目的不等于实际结果，but 后明确说明没有赢。'],
 ['计划：方法是每天听录音，目的是改善发音。哪句最完整？','I will learn by listening every day in order to improve my pronunciation.|I will learn by listen every day in order to improving my pronunciation.|I will learn in order to listening every day by improve my pronunciation.','方法用 by listening，目的用 in order to improve，频率也与计划相符。']
 ]});
 add('patterns','重点短语与句型',{id:'time-prepositions',title:'时间与介词后的 doing',rule:'spend time doing / on sth；about、in、for、on 等介词后接名词或 doing。',pitfall:'不要把 spend time doing 写成 spend time to do；focus on 中的 on 是介词。',sentence:'I spend ten minutes practising and focus on learning useful sentences.',translation:'我花十分钟练习，并专注于学习有用的句子。',explain:'时间连到 practise 的 doing 形式；focus on 的动作也要变成 learning。',animation:{kind:'action',actors:['学习者'],labels:['ten minutes','practising','focus on learning']},rows:[
 ['I spend ten minutes ___ English every morning.','practising|to practise|practise','spend 时间 doing；教材用英式拼写 practising。'],
 ['She spends an hour ___ her homework.','on|to|by','spend time on sth 表示在某事上花时间。'],
 ['Focus on ___ useful sentences.','learning|learn|to learn','on 是介词，后用 learning。'],
 ['He is interested in ___ languages.','studying|study|to study','be interested in doing，in 后用动名词。'],
 ['She has a talent for ___.','drawing|draw|to draw','for 后可接动名词 drawing。'],
 ['They are curious about ___ new things.','discovering|discover|to discover','about 是介词，后接 discovering。'],
 ['He spends time ___ poems and is interested in ___ them.','reading; writing|to read; writing|reading; write','两处分别由 spend time doing 和 interested in doing 决定。'],
 ['改错：She focused on to learn and spent an hour read. 应改成？','learning; reading|learn; to read|to learning; reads','focus on learning；spend an hour reading。'],
 ['“I spend an hour on English”与“I spend an hour learning English”有何区别？','前者说科目，后者具体说明学习动作|前者必须改成 to English|后者 learning 必须改成 learn','on 后接名词；doing 结构突出具体活动，两种均可正确表达花时间。'],
 ['选择两处搭配都正确的学习记录。','I spent twenty minutes listening and focused on understanding the main idea.|I spent twenty minutes to listen and focused on understanding the main idea.|I spent twenty minutes listening and focused on understand the main idea.','过去时由 spent 表示，后面的 listening 和 understanding 仍由结构决定。']
 ]});
 add('patterns','重点短语与句型',{id:'degree-range',title:'尽可能与最……之一',rule:'as + 原级 + as possible；one of the + 最高级 + 可数名词复数。',pitfall:'as 中间不用比较级；one of 短语作主语时谓语通常用单数。',sentence:'Read as carefully as possible. One of the best learners is Amy.',translation:'尽可能仔细地读。最优秀的学习者之一是埃米。',explain:'尽可能仔细仍用 carefully 原级；从一组 learners 中选出 one，谓语对应一个人。',animation:{kind:'sequence',actors:['学习小组'],labels:['多名 learners','最高级 best','其中一个 one']},rows:[
 ['Read as ___ as possible.','carefully|more carefully|most carefully','as ... as 中用原级 carefully，修饰 read。'],
 ['Practise as ___ as possible.','often|more often|most often','as often as possible 表示尽可能经常。'],
 ['Spend as ___ time as possible on reading.','much|many|more','time 表时间量不可数，且 as ... as 中用原级 much。'],
 ['He is one of the best ___ in our class.','learners|learner|learning','one of 后使用可数名词复数。'],
 ['One of my classmates ___ good at English.','is|are|be','主语中心是 one，谓语用单数 is。'],
 ['He is one of the ___ people of his time.','most famous|more famous|famousest','one of the 后用最高级；famous 的最高级是 most famous。'],
 ['Amy reads as ___ as possible and is one of the best ___.','carefully; learners|more carefully; learners|carefully; learner','原级副词与复数名词分别匹配两种结构。'],
 ['改错：One of the best students are here. 应改哪处？','are → is|students → student|best → better','one of the best students 作主语时是其中一位，谓语用 is。'],
 ['“one of the best”能直接证明什么？','属于最优秀的一组，但未必是唯一第一|一定是所有人中唯一最好|比较对象只有两个人','one of 指优秀群体中的一员，不能推成唯一最高。'],
 ['学习建议及人物介绍，哪句两处都对？','Practise as often as possible. One of the most successful learners is Li Hua.|Practise as more often as possible. One of the most successful learners is Li Hua.|Practise as often as possible. One of the most successful learner are Li Hua.','原级 often；复数 learners；one 对应 is。']
 ]});
 add('patterns','重点短语与句型',{id:'useful-patterns',title:'借还、记录与建议',rule:'borrow from / return to；write it down；How about doing / Why not do。',pitfall:'return 不再加 back；代词放 write 和 down 中间；find it + adj. + to do。',sentence:'Borrow a book from Amy and return it to her. How about writing useful sentences down?',translation:'向埃米借一本书，再还给她。把有用的句子记下来怎么样？',explain:'借入与归还方向相反；提出行动建议时 How about 后用 doing，Why not 后用原形。',animation:{kind:'action',actors:['借书人','书主人'],labels:['borrow from','write it down','return to']},rows:[
 ['I borrowed a book ___ Amy.','from|to|for','borrow ... from ... 表示从某人那里借入。'],
 ['Please return the book ___ Amy.','to|from|at','return ... to ... 表示把东西归还给某人。'],
 ['These sentences are useful. Write ___ down.','them|they|their','write 后需要宾格；代词 them 放在 write 与 down 之间。'],
 ['How about ___ English aloud?','reading|read|to read','How about 后接 doing。'],
 ['Why not ___ every day?','practise|practising|to practise','Why not 后接动词原形。'],
 ['It is important ___ daily.','to practise|practising|practises','It is + adj. + to do，it 是形式主语。'],
 ['I find ___ useful to take notes, so I decided ___ a notebook.','it; to buy|that; buying|it; buying','find it + adj. + to do；decide to do。'],
 ['哪句同时正确使用借还和代词位置？','Borrow the book from Tom, write it down in your list, and return it to him.|Borrow the book to Tom and return it back to him.|Borrow the book from Tom and write down it in your list.','borrow from、return to；代词 it 放在 write 与 down 中间。'],
 ['“Please return it back”与“Please give it back”哪项判断准确？','前者 back 重复，后者搭配正确|两句 back 都多余|两句 return 和 give 意义完全相同','return 已含“归还”；give back 是表示归还的完整搭配。'],
 ['小明觉得记句子有用，并建议大家朗读。哪句正确？','He finds it useful to write sentences down. How about reading them aloud?|He finds it useful writing down sentences. How about read them aloud?|He finds that useful to write sentences down. Why not to read them aloud?','find it useful to do；How about doing；此处不用 that 替代形式宾语 it。']
 ]});
 add('adverbs','副词比较级与最高级',{id:'form-function',title:'修饰动作与规则变化',rule:'副词说明动作怎样进行；fast—faster，early—earlier，carefully—more carefully。',pitfall:'careful 修饰名词，carefully 修饰动作；early 虽以 -ly 结尾也用 earlier。',sentence:'Amy is a careful reader. She reads more carefully than before.',translation:'埃米是个细心的读者。她比以前读得更仔细。',explain:'先确定修饰的是 reader 还是 reads，再根据是否比较决定形式。',animation:{kind:'transform',actors:['Amy'],labels:['careful reader','read carefully','more carefully']},rows:[
 ['He is a ___ learner.','careful|carefully|more carefully','learner 是名词，用形容词 careful 修饰。'],
 ['He reads ___.','carefully|careful|carefulness','修饰动作 reads 用副词 carefully。'],
 ['fast 的比较级是？','faster|more faster|fastly','fast 的比较级是 faster，不能再加 more。'],
 ['She arrives ___ than Tom.（更早）','earlier|more early|earlyest','early 的比较级是 earlier。'],
 ['Please write ___ than before.（更仔细）','more carefully|carefuller|more careful','write 用副词修饰；carefully 的比较级是 more carefully。'],
 ['hard 的最高级是？','hardest|most harder|hardly','hard—harder—hardest；hardly 意为几乎不。'],
 ['A ___ student checks answers ___.','careful; carefully|carefully; careful|careful; careful','前空修饰 student，后空修饰 checks。'],
 ['Which is correct?','She answers more correctly than before.|She answers correctlier than before.|She answers more correct than before.','correctly 修饰 answers，比较级用 more correctly。'],
 ['early 与 carefully 都以 -ly 结尾，怎样判断比较级？','分别记 earlier 与 more carefully，不能只看 -ly|两者都直接加 er|两者都必须加 more','early 的词形变化特殊，单按结尾不能推断所有副词的变化。'],
 ['比赛记录：原来读得快，现在更仔细也更早开始。选正确总结。','She now reads more carefully and starts earlier.|She now reads more careful and starts more early.|She now reads carefullyer and starts earliest than before.','修饰动作采用副词，比较用 more carefully 与 earlier。']
 ]});
 add('adverbs','副词比较级与最高级',{id:'irregular-degree',title:'不规则变化与程度',rule:'well—better—best；badly—worse—worst；比较级可用 much 修饰。',pitfall:'better 已是比较级，不写 more better 或 very better；far 的比较形式有 farther/further。',sentence:'She speaks English much better now and travels farther to practise.',translation:'她现在英语说得好多了，还到更远的地方去练习。',explain:'well 不按规则加 er；much 强调改善程度，但不再增加一层 more。词形链中的 best 不表示这位学习者已经达到组内第一。',animation:{kind:'transform',actors:['副词词形'],labels:['well 原级','better 比较级','best 最高级']},rows:[
 ['well 的比较级是？','better|weller|more weller','well—better—best。'],
 ['badly 的最高级是？','worst|worse|baddest','badly—worse—worst。'],
 ['He speaks English ___ than before.','better|best|wellest','than 提示比较；well 的比较级是 better。'],
 ['She sings ___ better now.','much|very|more','much 可以修饰比较级 better；very 不直接修饰比较级。'],
 ['Yesterday I did badly; today I did even ___.（更差）','worse|worst|badlyer','badly 的比较级是 worse，even 可修饰比较级。'],
 ['表示实际距离“更远”，哪一组都是可用的比较级？','farther / further|farthest / furthest|far / farthest','farther 与 further 均可表示实际距离更远；最高级不同。'],
 ['哪句比较结构正确？','She performed much better than before.|She performed more better than before.|She performed very better than before.','better 已经是比较级，程度修饰可用 much。'],
 ['三人中表现最差，应填：He performed ___ of the three.','worst|worse|more badlyer','三人范围内的最差用 badly 的最高级 worst。'],
 ['“He sings better than before”能证明他在全班最好吗？','不能，只比较他现在和以前|能，better 就是全班最好|能，副词没有比较范围','比较级与本人过去相比，不提供全班排名。'],
 ['测验：A 比以前进步很多，B 是三人中表现最差。选正确表述。','A did much better than before; B did worst of the three.|A did very better than before; B did worse of the three.|A did more better than before; B did badlyest of the three.','程度修饰用 much better；明确三人之最用 worst。']
 ]});
 add('adverbs','副词比较级与最高级',{id:'comparison-range',title:'同样、比较与范围',rule:'as + 副词原级 + as；比较级 + than；最高级与三者以上范围搭配。',pitfall:'study hard 是努力学习，hardly 是几乎不；here、yesterday 通常没有比较级。',sentence:'Tom works as hard as Jack. Amy reads faster than the other two students.',translation:'汤姆和杰克一样努力。埃米读得比另外两位同学快。',explain:'相等时不用比较级；与其余两人作为比较对象时，faster than 仍是正确比较。',animation:{kind:'transform',actors:['Tom','Jack'],labels:['work hard','as hard as','同样努力']},rows:[
 ['Tom works as ___ as Jack.','hard|harder|hardest','as ... as 中间用原级 hard。'],
 ['She does not read as ___ as Amy.','quickly|more quickly|most quickly','否定的同级比较仍用原级副词。'],
 ['He studies ___ every day.（努力地）','hard|hardly|harderly','hard 是努力地；hardly 是几乎不。'],
 ['He can hardly hear. 意思是？','他几乎听不见|他很努力地听见|他听得最清楚','hardly 表否定意义“几乎不”。'],
 ['Amy reads ___ than Sandy.','faster|fastest|as fast','than 前用比较级 faster。'],
 ['Millie reads the ___ among the three.','fastest|faster|fastly','三人中最快，用最高级 fastest。'],
 ['哪句可以表达“三人中米莉读得最快”？','Millie reads faster than the other two students.|Millie reads faster than any student, including herself.|Millie reads as faster as the other two students.','比较级可以与“其余两个人”比较；应排除自己，as 中不能用 faster。'],
 ['关于副词最高级，哪项准确？','最高级前的 the 常可省略|最高级前的 the 永远必须保留|有 the 的副词一定错误','副词最高级前的 the 常可省，但表示比较范围仍需清晰。'],
 ['A runs as fast as B. B runs faster than C. 能推出？','A runs faster than C.|C runs fastest.|A runs more faster than B.','A 与 B 同速，而 B 快于 C，因此 A 也快于 C。'],
 ['学习记录：两人同样努力；三人中 Amy 阅读最快；Tom 几乎不迟到。哪组词正确？','as hard as; fastest; hardly|as harder as; faster; hard|as hardly as; most faster; harder','相等用原级 hard；三者之最用 fastest；几乎不用 hardly。']
 ]});
 add('reflexives','反身代词',{id:'self-reference',title:'动作回到自己',rule:'主语与动作涉及的“自己”是同一对象时，按人称选择反身代词。',pitfall:'myself / yourself / himself / herself / itself；复数 ourselves / yourselves / themselves。',sentence:'My brother taught me English. I taught myself English.',translation:'哥哥教我英语。我自学英语。',explain:'第一句教与学是两个人，用 me；第二句教与学都是 I，用 myself。',animation:{kind:'reflexive',actors:['I','myself'],labels:['教的人 I','学的人也是 I','teach myself']},rows:[
 ['I taught ___ English.（我自学）','myself|me|himself','教与学是同一个 I，用 myself。'],
 ['She made a plan for ___.（为她自己）','herself|himself|itself','she 对应 herself。'],
 ['We set goals for ___.','ourselves|ourself|themselves','we 是复数，对应 ourselves。'],
 ['They enjoyed ___ at the party.','themselves|theirselves|themself','they 对应 themselves。'],
 ['The cat cleaned ___.','itself|himself|itselves','it 的反身代词是 itself。'],
 ['My brother taught ___ English.（哥哥教我）','me|myself|himself','主语是哥哥，宾语是我，不是同一个人，用 me。'],
 ['Jack taught himself; Jack taught him. 两句的区别是？','前句是自学，后句教另一个男性|两句都一定是自学|后句一定是 Jack 教自己','himself 明确回指主语；这里 him 指另一人。'],
 ['He hurt ___, but his sister helped ___.','himself; him|him; herself|hisself; himself','他伤到自己用 himself；姐姐帮助他，主宾不同用 him。'],
 ['“The twins taught themselves French.” 是否能证明有人在课堂教他们？','不能，句子说明他们自学|能，themselves 指老师|能，twins 意味着两个老师','themselves 回指 twins，指他们教自己，未提供课堂教师的信息。'],
 ['我们自学后与另一组交流，哪句代词都对？','We taught ourselves and shared ideas with them.|We taught ourself and shared ideas with themselves.|We taught themselves and shared ideas with ourselves.','题设主体是 we，自学用 ourselves；与另一组交流用 them。']
 ]});
 add('reflexives','反身代词',{id:'self-phrases',title:'独立、表达与亲自',rule:'teach / enjoy / express oneself；by oneself 表独立；反身代词也可强调亲自。',pitfall:'对一个人用 yourself，对多人用 yourselves；Help yourselves, children。',sentence:'She expressed herself in English and finished the task by herself.',translation:'她用英语表达自己，并独立完成了任务。',explain:'express herself 中自己是表达的对象；by herself 强调没有别人帮助。',animation:{kind:'reflexive',actors:['She','herself'],labels:['express herself','by herself','独立完成']},rows:[
 ['Help ___, Tom.','yourself|yourselves|themselves','只对 Tom 一人说话，用 yourself。'],
 ['Help ___, children.','yourselves|yourself|ourselves','children 是多人，用 yourselves。'],
 ['She can express ___ in English.','herself|himself|her','express oneself 表达自己的想法。'],
 ['They enjoyed ___ yesterday.','themselves|them|their','enjoy oneself 表示玩得开心。'],
 ['He finished the work by ___.（独立地）','himself|hisself|his','by himself 表独自或独立完成。'],
 ['I made the model myself. myself 在这里强调什么？','我亲自做的|模型做了我|有很多人一起做','句末 myself 强调主语亲自完成。'],
 ['Ann, enjoy ___! Boys, enjoy ___ too!','yourself; yourselves|yourselves; yourself|herself; themselves','直接对一人用 yourself，对多人用 yourselves，不能按提及姓名改成第三人称。'],
 ['He often repeats himself. 通常表示？','他常重复自己说过的话|他经常复制出另一个自己|他从来不重复','repeat oneself 指重复自己说过的话，不是字面复制人。'],
 ['“I made it myself”与“I made it by myself”哪项更准确？','前者强调亲自，后者强调独立完成|两句都只表示替别人做|前者一定否定所有帮助','myself 强调亲自；by myself 更突出无他人帮助。'],
 ['两位客人到访，主人邀他们随便吃，并说食物是自己亲手做的。应选？','Help yourselves. I made the food myself.|Help yourself. I made the food themselves.|Help themselves. I made the food myselves.','对两人用 yourselves；主语 I 对应 myself。']
 ]});
 add('formation','词形与后缀',{id:'people-suffixes',title:'表示人的后缀',rule:'learner / inventor / scientist；write 直接加 r 变为 writer；winner 双写 n。',pitfall:'后缀不能随意替换；piano → pianist，biology → biologist，printer 也可指打印机。',sentence:'The winner is a young pianist. An inventor makes new things.',translation:'获胜者是一位年轻的钢琴家。发明家创造新的事物。',explain:'先确认表示哪种人，再检查词根、后缀和拼写变化，不是所有词都直接加 er。',animation:{kind:'transform',actors:['词根','人物名词'],labels:['win','winner','piano → pianist']},rows:[
 ['learn 表示“学习者”的名词是？','learner|learnor|learnist','learner 使用 -er。'],
 ['invent 表示“发明家”的名词是？','inventor|inventist|inventation','inventor 表示人，invention 表示发明。'],
 ['science 表示“科学家”的词是？','scientist|sciencer|scienceor','science 对应 scientist，不能任意添加后缀。'],
 ['write 对应“作家”的正确拼写是？','writer|writeer|writor','write + r 构成 writer，不双写 e。'],
 ['win 对应“获胜者”的名词是？','winner|winer|winor','winner 双写 n 后加 er。'],
 ['piano 对应“钢琴家”的正确词形是？','pianist|pianoist|pianoer','piano 变 pianist，不能直接加 ist。'],
 ['plan → ___；biology → ___。','planner; biologist|planer; biologyist|plannor; biologer','planner 双写 n；biology 变 biologist。'],
 ['tour → tourist；dance → dancer。哪项概括正确？','后缀与拼写要逐词核对|所有词都加 ist|所有词都先双写末字母','两组词采用不同后缀和拼写规则，不能一概而论。'],
 ['“The printer is broken.” 中 printer 最可能指什么？','打印机|获胜者|旅行者','broken 的语境支持设备义；-er 不保证一定表示人。'],
 ['“获胜者是钢琴家，另一位是发明家。”正确词形组合是？','winner; pianist; inventor|winer; pianoist; inventer|winner; pianoer; invention','winner 双写，pianist 特殊变化，inventor 表示人。']
 ]});
 add('formation','词形与后缀',{id:'word-chains',title:'名词、形容词与副词',rule:'success—successful—successfully；pronounce—pronunciation；invent— invention / inventor。',pitfall:'先看句法位置再选词形；pronunciation 不拼成 pronounciation。',sentence:'The successful inventor finished the invention successfully.',translation:'这位成功的发明家成功地完成了这项发明。',explain:'successful 修饰人，inventor 表人，invention 表成果，successfully 修饰完成动作。',animation:{kind:'transform',actors:['success'],labels:['success 名词','successful 形容词','successfully 副词']},rows:[
 ['He is a ___ learner.','successful|success|successfully','修饰 learner 用形容词 successful。'],
 ['She finished the task ___.','successfully|successful|success','修饰 finished 用副词 successfully。'],
 ['Their ___ made them happy.（成功）','success|successful|successfully','their 后这里需要名词 success 作主语中心词。'],
 ['Reading aloud improves my ___.','pronunciation|pronounciation|pronounce','improves 后需要名词 pronunciation，注意拼写。'],
 ['An ___ makes new things.','inventor|invention|invent','表示人用 inventor。'],
 ['The telephone was an important ___.','invention|inventor|invent','电话是发明成果，用 invention。'],
 ['The ___ learner completed the work ___.','successful; successfully|successfully; successful|success; successful','前空修饰人用形容词，后空修饰完成动作用副词。'],
 ['Please ___ the word clearly. Your ___ is improving.','pronounce; pronunciation|pronunciation; pronounce|pronounce; pronounciation','祈使句用动词原形 pronounce；物主代词后用名词 pronunciation。'],
 ['“The invention was successful.” 为何不是 successfully？','was 后描述主语性质，用形容词|凡是过去时都用形容词|successful 是一种过去式','系动词 was 后作表语，说明发明是成功的；与时态没有这种对应关系。'],
 ['介绍发明家：他成功完成发明，发音也改善了。哪组词准确？','inventor; successfully; invention; pronunciation|invention; successful; inventor; pronounce|inventor; success; invention; pronounciation','人物、修饰动作、成果和发音分别使用对应词形。']
 ]});
 add('formation','词形与后缀',{id:'past-plurals',title:'同形动词与复数',rule:'find—found；found（创建）—founded；teach—taught；feed—fed。',pitfall:'找到与创建的 found 不同；century → centuries，journey → journeys。',sentence:'They founded a club and found new friends there.',translation:'他们创办了俱乐部，并在那里找到了新朋友。',explain:'第一个动词原形是 found（创建），过去式 founded；第二个原形是 find，过去式 found。',animation:{kind:'choice',actors:['find','found'],labels:['找到 → found','创建 → founded','分清原形']},rows:[
 ['Yesterday I ___ my lost pen.','found|founded|finded','找到的原形是 find，过去式 found。'],
 ['They ___ a club last year.（创办）','founded|find|finded','创建的原形是 found，过去式 founded。'],
 ['teach 的过去式是？','taught|teached|teacht','teach—taught—taught。'],
 ['feed 的过去式是？','fed|feeded|fedded','feed—fed—fed。'],
 ['century 的复数是？','centuries|centurys|centuryes','辅音字母加 y 结尾，变 y 为 i 再加 es。'],
 ['journey 的复数是？','journeys|journies|journeyes','元音字母加 y 结尾，直接加 s。'],
 ['They ___ a school in 1990 and ___ old photos there yesterday.','founded; found|found; founded|finded; found','创建学校用 founded；找到照片用 found。'],
 ['He ___ himself and ___ the birds when he was young.','taught; fed|teached; feeded|taught; feeded','两个不规则过去式分别是 taught 与 fed。'],
 ['“They found the town in an old map.” 和“They founded the town.” 动作相同吗？','不同，前者找到地点，后者建立城镇|相同，都是建立城镇|相同，都是找到地图','found 可是 find 的过去式，而 founded 是创建的过去式。'],
 ['历史记录：两个世纪前创办学校，旅行途中找到资料。选正确词形。','Two centuries ago they founded a school; during their journeys they found useful records.|Two centurys ago they found a school; during their journies they founded useful records.|Two centuries ago they finded a school; during their journeys they found useful records.','centuries、journeys 复数规则不同；创建与找到的过去式也不同。']
 ]});
 add('reading','阅读与学习经历写作',{id:'evidence-methods',title:'人物品质与学习方法',rule:'用人物行动支持品质；区分有效方法与天赋，不能凭一句话扩大结论。',pitfall:'富兰克林自学与坚持有具体事实；赵元任的方法不等于“只靠天赋”。',sentence:'He saw learning as an exciting journey and kept learning throughout his life.',translation:'他把学习看作一段令人兴奋的旅程，并终身坚持学习。',explain:'把“读书自学、探究、年老仍发明、分享成果”等证据连接到具体品质；语言学习则落实多听、多说和在语境中学。',animation:{kind:'sequence',actors:['终身学习者'],labels:['读书自学','坚持探究','分享成果']},rows:[
 ['人物只受过两年学校教育，却通过大量阅读自学。最支持哪项？','主动学习|从不阅读|只靠课堂','“通过大量阅读自学”是主动学习的直接证据。'],
 ['富兰克林七十多岁仍发明，主要支持什么品质？','坚持学习与创造|年老就停止思考|只关心学校分数','年老仍发明支持持续学习与创造。'],
 ['让人免费使用自己的发明，最能支持什么？','愿意分享|拒绝帮助他人|从未发明','免费使用成果与分享、帮助别人相关。'],
 ['“多与当地人交流”主要属于哪种内容？','具体学习方法|出生年份|考试成绩','交流是可执行的语言实践方法。'],
 ['Learn sentences rather than single words. 建议重点是什么？','结合句子和语境学词|完全不学词义|只背孤立字母','rather than 构成选择对比，强调句子语境。'],
 ['读到人物品质题，最应先找什么？','相关行动与事实|自己喜欢的形容词|文章字数','观点需要具体文本证据支持。'],
 ['材料说赵元任重视交流、记录句子。哪项概括合理？','他运用了具体有效的方法|他完全不需要练习|他只靠天赋学会一切','方法有明确证据，不能把天赋当成唯一原因。'],
 ['把“研究暴风雨”作为证据，哪种品质最贴切？','好奇并勇于探究|永远不会遇到困难|不愿观察自然','研究自然现象支持好奇与探究，不支持绝对化结论。'],
 ['某人受学校教育时间短但自学很多，能推出什么？','正规教育经历短不等于他没有持续学习|学校教育对所有人完全无用|每个人只上两年学就足够','个体经历能支持持续学习，不能推成普遍教育结论。'],
 ['班级要制定语言学习方案，哪组最符合“方法＋行动＋证据”？','每天与伙伴交流，记录句子，每周比较表达进步|只说自己有天赋，不安排练习|照搬人物年龄作为学习计划','具体行动可执行，比较前后表现能检验进步，与本文方法相符。']
 ]});
 add('reading','阅读与学习经历写作',{id:'experience-writing',title:'困难、行动、进步',rule:'学习经历按“困难→具体行动→进步与感悟”组织；过去经历主要用过去时。',pitfall:'频率与方法要具体；英式 practice 常作名词、practise 作动词，不能拿范文猜听力答案。',sentence:'I practised speaking every day. After two months, I could speak more clearly.',translation:'我每天练习口语。两个月后，我能说得更清楚了。',explain:'先交代困难，再说明做了什么和多长时间，最后用真实变化支持“熟能生巧”。',animation:{kind:'sequence',actors:['学习者'],labels:['发音不清楚','每天练口语','表达更清楚']},rows:[
 ['学习经历最清晰的顺序是？','困难→行动→进步|进步→无关笑话→天气|只反复说英语重要','困难、行动和进步构成有因果联系的完整经历。'],
 ['哪项行动更具体？','每天听录音十分钟|我要变好|学习很重要','明确做法与频率，让行动可执行。'],
 ['Last month I ___ English every day.','practised|practise|practises','last month 表过去，动词用过去式 practised。'],
 ['I practise ___ every day.','speaking|speak|to speak','practise doing，使用 speaking。'],
 ['Practice makes perfect. 最合适的理解是？','持续练习有助于熟练|只要想一想就完美|练一次就永不出错','熟能生巧强调持续实践，不保证一次即完美。'],
 ['英式拼写中表示“练习”这个动作应选？','practise|practice 名词|practiserly','教材采用英式拼写，动词用 practise；practice 常作名词。'],
 ['哪段行动与困难对应最好？','发音不清楚，所以每天跟读并比较录音|发音不清楚，所以只整理书包|发音不清楚，所以删去全部英语活动','跟读和比较录音直接针对发音问题。'],
 ['叙述上月练习和现在状态，哪句时态合理？','I practised every day last month. Now I speak more clearly.|I practise every day last month. Now I spoke clearly yesterday.|I practised tomorrow. Now I speaking clearly.','过去经历用过去时；现在状态可用一般现在时。'],
 ['范文说作者练了两个月；一道未听到录音的听力题问时间。能照填“两个月”吗？','不能，范文不提供该听力录音的证据|能，只要主题相同|能，任何学习都需要两个月','不同材料不能相互冒充证据，需听力原材料。'],
 ['哪段学习经历完整且有依据？','I could not pronounce the words clearly. I practised with recordings for ten minutes daily. After two months, I spoke more clearly.|I could not pronounce words. English is nice. My bag is blue.|I practised once, so I will never make any mistake again.','第一段有困难、具体行动、可描述的进步；后两段缺联系或过度承诺。']
 ]});
 window.GrowingEnglishPointCourses.define('english-8a-03',{lessons});
})();
