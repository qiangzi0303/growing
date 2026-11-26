/* Unit 3 unified classroom: textbook-checked scope; new shared records, no legacy score import. */
(()=>{
 const words=[
  {
    "id": "w1",
    "word": "learner",
    "meaning": "n. 学习者",
    "pos": "n.",
    "optional": false,
    "example": "A good learner asks questions.",
    "translation": "善学者会提问题。",
    "tip": "learn + -er：从“学习”到“学习者”。"
  },
  {
    "id": "w2",
    "word": "feed",
    "meaning": "v. 喂养；提供食物",
    "pos": "v.",
    "optional": false,
    "example": "We feed the birds every morning.",
    "translation": "我们每天早上喂鸟。",
    "tip": "不规则变化：feed—fed—fed。"
  },
  {
    "id": "w3",
    "word": "fish",
    "meaning": "v. 钓鱼；捕鱼",
    "pos": "v.",
    "optional": false,
    "example": "My grandfather taught me to fish.",
    "translation": "爷爷教我钓鱼。",
    "tip": "本课谚语中作动词：teach a man to fish。"
  },
  {
    "id": "w4",
    "word": "lifetime",
    "meaning": "n. 一生",
    "pos": "n.",
    "optional": false,
    "example": "Learning is a journey for a lifetime.",
    "translation": "学习是一生的旅程。",
    "tip": "life + time；for a lifetime 一辈子。"
  },
  {
    "id": "w5",
    "word": "journey",
    "meaning": "n. 旅程；旅行",
    "pos": "n.",
    "optional": false,
    "example": "Every journey begins with a first step.",
    "translation": "每段旅程都始于第一步。",
    "tip": "元音字母 + y，复数直接加 s：journeys。"
  },
  {
    "id": "w6",
    "word": "single",
    "meaning": "adj. 单个的；单身的",
    "pos": "adj.",
    "optional": false,
    "example": "Start with a single step.",
    "translation": "从第一步开始。",
    "tip": "a single step 一步；single words 单个词语。"
  },
  {
    "id": "w7",
    "word": "against",
    "meaning": "prep. 逆；反对",
    "pos": "prep.",
    "optional": false,
    "example": "It is hard to row against the current.",
    "translation": "逆流划船很难。",
    "tip": "逆水行舟中的 against 表示“逆着”。"
  },
  {
    "id": "w8",
    "word": "fall behind",
    "meaning": "短语 落后",
    "pos": "短语",
    "optional": false,
    "example": "Keep learning, or you may fall behind.",
    "translation": "坚持学习，否则你可能会落后。",
    "tip": "fall—fell—fallen；fall behind others 落后于别人。"
  },
  {
    "id": "w9",
    "word": "successful",
    "meaning": "adj. 成功的；有成效的",
    "pos": "adj.",
    "optional": false,
    "example": "She is a successful writer.",
    "translation": "她是一位成功的作家。",
    "tip": "success → successful → successfully。"
  },
  {
    "id": "w10",
    "word": "drive",
    "meaning": "n. 冲劲；动力",
    "pos": "n.",
    "optional": false,
    "example": "He has strong drive to learn.",
    "translation": "他有强烈的学习动力。",
    "tip": "本单元作名词，指学习动力，不是“驾驶”。"
  },
  {
    "id": "w11",
    "word": "guide",
    "meaning": "v. 指导；领路",
    "pos": "v.",
    "optional": false,
    "example": "Good teachers guide us on the right path.",
    "translation": "好老师引导我们走上正确的道路。",
    "tip": "guide sb. 引导某人；作名词时还可以指向导。"
  },
  {
    "id": "w12",
    "word": "lifelong",
    "meaning": "adj. 终身的",
    "pos": "adj.",
    "optional": false,
    "example": "Franklin was a lifelong learner.",
    "translation": "富兰克林是一名终身学习者。",
    "tip": "life + long；放在名词前：a lifelong learner。"
  },
  {
    "id": "w13",
    "word": "inventor",
    "meaning": "n. 发明家",
    "pos": "n.",
    "optional": false,
    "example": "The inventor made a useful machine.",
    "translation": "这位发明家制造了一台有用的机器。",
    "tip": "invent + -or 表示人，invention 表示发明。"
  },
  {
    "id": "w14",
    "word": "found",
    "meaning": "v. 创建；建立",
    "pos": "v.",
    "optional": false,
    "example": "They founded a reading club last year.",
    "translation": "他们去年创办了一个阅读俱乐部。",
    "tip": "found—founded—founded；不要和 find 的过去式混淆。"
  },
  {
    "id": "w15",
    "word": "talent",
    "meaning": "n. 天资；才能",
    "pos": "n.",
    "optional": false,
    "example": "Zhao had a talent for languages.",
    "translation": "赵元任有语言天赋。",
    "tip": "have a talent for + 名词或 doing。"
  },
  {
    "id": "w16",
    "word": "century",
    "meaning": "n. 世纪；百年",
    "pos": "n.",
    "optional": false,
    "example": "He lived in the eighteenth century.",
    "translation": "他生活在十八世纪。",
    "tip": "辅音字母 + y，复数为 centuries。"
  },
  {
    "id": "w17",
    "word": "set ... apart",
    "meaning": "短语 使……与众不同",
    "pos": "短语",
    "optional": false,
    "example": "His love of learning set him apart.",
    "translation": "他对学习的热爱使他与众不同。",
    "tip": "set A apart from B；代词放中间：set him apart。"
  },
  {
    "id": "w18",
    "word": "print",
    "meaning": "n. / v. 印刷行业；印刷",
    "pos": "n. / v.",
    "optional": false,
    "example": "He worked in a print shop.",
    "translation": "他在一家印刷店工作。",
    "tip": "课文中用 print shop；构词时 print → printer。"
  },
  {
    "id": "w19",
    "word": "himself",
    "meaning": "pron. 他自己",
    "pos": "pron.",
    "optional": false,
    "example": "He taught himself English.",
    "translation": "他自学英语。",
    "tip": "与 he 对应；teach himself 自学。"
  },
  {
    "id": "w20",
    "word": "bookseller",
    "meaning": "n. 书商",
    "pos": "n.",
    "optional": false,
    "example": "The bookseller lent him a book.",
    "translation": "书商借给他一本书。",
    "tip": "book + seller；borrow books from a bookseller。"
  },
  {
    "id": "w21",
    "word": "in order to",
    "meaning": "短语 为了",
    "pos": "短语",
    "optional": false,
    "example": "I read aloud in order to improve my pronunciation.",
    "translation": "我朗读是为了改善发音。",
    "tip": "后接动词原形，表示目的；不是 in return to。"
  },
  {
    "id": "w22",
    "word": "return",
    "meaning": "v. 归还",
    "pos": "v.",
    "optional": false,
    "example": "Please return the book to me tomorrow.",
    "translation": "请明天把书归还给我。",
    "tip": "return sth. to sb.；不用 return back。"
  },
  {
    "id": "w23",
    "word": "curious",
    "meaning": "adj. 好奇的",
    "pos": "adj.",
    "optional": false,
    "example": "She is curious about the world.",
    "translation": "她对世界充满好奇。",
    "tip": "be curious about + 名词或 doing。"
  },
  {
    "id": "w24",
    "word": "storm",
    "meaning": "n. 暴风雨",
    "pos": "n.",
    "optional": false,
    "example": "Franklin became interested in studying storms.",
    "translation": "富兰克林开始对研究暴风雨感兴趣。",
    "tip": "study storms 研究暴风雨。"
  },
  {
    "id": "w25",
    "word": "finding",
    "meaning": "n. 调查发现",
    "pos": "n.",
    "optional": false,
    "example": "His findings helped predict the weather.",
    "translation": "他的发现有助于预测天气。",
    "tip": "研究发现常用复数 findings；区分动词 find。"
  },
  {
    "id": "w26",
    "word": "predict",
    "meaning": "v. 预测",
    "pos": "v.",
    "optional": false,
    "example": "Scientists use data to predict the weather.",
    "translation": "科学家利用数据预测天气。",
    "tip": "predict the weather 预测天气。"
  },
  {
    "id": "w27",
    "word": "countless",
    "meaning": "adj. 数不尽的",
    "pos": "adj.",
    "optional": false,
    "example": "There are countless ways to learn.",
    "translation": "学习的方法数不胜数。",
    "tip": "count + -less；countless inventions 无数发明。"
  },
  {
    "id": "w28",
    "word": "invention",
    "meaning": "n. 发明",
    "pos": "n.",
    "optional": false,
    "example": "This invention helps people see better.",
    "translation": "这项发明帮助人们看得更清楚。",
    "tip": "invent 是动作，inventor 是人，invention 是发明。"
  },
  {
    "id": "w29",
    "word": "come as no surprise",
    "meaning": "短语 不足为奇",
    "pos": "短语",
    "optional": false,
    "example": "His success came as no surprise.",
    "translation": "他的成功不足为奇。",
    "tip": "叙述过去的事，用 came as no surprise。"
  },
  {
    "id": "w30",
    "word": "invent",
    "meaning": "v. 发明",
    "pos": "v.",
    "optional": false,
    "example": "He wanted to invent something useful.",
    "translation": "他想发明有用的东西。",
    "tip": "指创造原来没有的东西；invent a machine。"
  },
  {
    "id": "w31",
    "word": "for free",
    "meaning": "短语 免费",
    "pos": "短语",
    "optional": false,
    "example": "You can use the app for free.",
    "translation": "你可以免费使用这个应用。",
    "tip": "use ... for free 免费使用……。"
  },
  {
    "id": "w32",
    "word": "greatness",
    "meaning": "n. 伟大",
    "pos": "n.",
    "optional": false,
    "example": "We remember him for his greatness.",
    "translation": "我们因他的伟大而铭记他。",
    "tip": "great + -ness：形容词变名词。"
  },
  {
    "id": "w33",
    "word": "success",
    "meaning": "n. 成功",
    "pos": "n.",
    "optional": false,
    "example": "Hard work can lead to success.",
    "translation": "努力能够通向成功。",
    "tip": "achieve success 获得成功；与 successful 区分词性。"
  },
  {
    "id": "w34",
    "word": "Italian",
    "meaning": "n. 意大利语；意大利人",
    "pos": "n.",
    "optional": false,
    "example": "She can speak Italian.",
    "translation": "她会说意大利语。",
    "tip": "本单元词表收录名词义；语言名首字母大写。"
  },
  {
    "id": "w35",
    "word": "themselves",
    "meaning": "pron. 他们／她们／它们自己",
    "pos": "pron.",
    "optional": false,
    "example": "They enjoyed themselves at the party.",
    "translation": "他们在聚会上玩得很开心。",
    "tip": "与 they 对应；复数词尾为 -selves。"
  },
  {
    "id": "w36",
    "word": "conversation",
    "meaning": "n. 交谈；谈话",
    "pos": "n.",
    "optional": false,
    "example": "I had a conversation with a visitor.",
    "translation": "我与一位来访者交谈了。",
    "tip": "have a conversation with sb. 与某人交谈。"
  },
  {
    "id": "w37",
    "word": "translate",
    "meaning": "v. 翻译",
    "pos": "v.",
    "optional": false,
    "example": "Please translate the sentence into Chinese.",
    "translation": "请把这个句子译成汉语。",
    "tip": "translate A into B：把 A 翻译成 B。"
  },
  {
    "id": "w38",
    "word": "page",
    "meaning": "n. 页",
    "pos": "n.",
    "optional": false,
    "example": "Please turn to page forty.",
    "translation": "请翻到第四十页。",
    "tip": "on page 40；read ten pages。"
  },
  {
    "id": "w39",
    "word": "badly",
    "meaning": "adv. 不好地；严重地",
    "pos": "adv.",
    "optional": false,
    "example": "He did badly in the test.",
    "translation": "他这次测验表现不好。",
    "tip": "badly—worse—worst，不规则变化。"
  },
  {
    "id": "w40",
    "word": "yourself",
    "meaning": "pron. 你自己",
    "pos": "pron.",
    "optional": false,
    "example": "You can teach yourself English.",
    "translation": "你可以自学英语。",
    "tip": "对一个人说话时使用；与 yourselves 区分。"
  },
  {
    "id": "w41",
    "word": "yourselves",
    "meaning": "pron. 你们自己",
    "pos": "pron.",
    "optional": false,
    "example": "Help yourselves to some fruit, children.",
    "translation": "孩子们，随便吃点水果。",
    "tip": "对两人或多人说话时使用，词尾为 -selves。"
  },
  {
    "id": "w42",
    "word": "record",
    "meaning": "v. / n. 录制；记录；纪录",
    "pos": "v. / n.",
    "optional": false,
    "example": "Record your voice and listen to it.",
    "translation": "录下你的声音，再听一听。",
    "tip": "动词重音在后，名词重音在前。"
  },
  {
    "id": "w43",
    "word": "printer",
    "meaning": "n. 印刷工；印刷商；打印机",
    "pos": "n.",
    "optional": false,
    "example": "We use a printer to print the text.",
    "translation": "我们用打印机打印文章。",
    "tip": "-er 不一定只指人，printer 也可以指机器。"
  },
  {
    "id": "w44",
    "word": "slashie",
    "meaning": "n. 斜杠族；多重职业者",
    "pos": "n.",
    "optional": false,
    "example": "A slashie may be a writer and a photographer.",
    "translation": "斜杠族可以既是作家又是摄影师。",
    "tip": "同一个人兼有多种职业身份。"
  },
  {
    "id": "w45",
    "word": "dialect",
    "meaning": "n. 方言",
    "pos": "n.",
    "optional": false,
    "example": "Zhao could speak over thirty Chinese dialects.",
    "translation": "赵元任会说三十多种汉语方言。",
    "tip": "speak different dialects 说不同的方言。"
  },
  {
    "id": "w46",
    "word": "besides",
    "meaning": "prep. 除……之外还",
    "pos": "prep.",
    "optional": false,
    "example": "Besides English, she learns French.",
    "translation": "除英语外，她还学法语。",
    "tip": "包含提到的这一项；beside（拓展）是“在旁边”。"
  },
  {
    "id": "w47",
    "word": "possible",
    "meaning": "adj. 可能的",
    "pos": "adj.",
    "optional": false,
    "example": "It is possible to learn a little every day.",
    "translation": "每天学一点是做得到的。",
    "tip": "常用于 as ... as possible；关联词 impossible 不可能的。"
  },
  {
    "id": "w48",
    "word": "as ... as possible",
    "meaning": "短语 尽可能……",
    "pos": "短语",
    "optional": false,
    "example": "Practise speaking as often as possible.",
    "translation": "尽可能经常练习口语。",
    "tip": "中间常用原级：as carefully as possible。"
  },
  {
    "id": "w49",
    "word": "sentence",
    "meaning": "n. 句子",
    "pos": "n.",
    "optional": false,
    "example": "Learn new words in useful sentences.",
    "translation": "在有用的句子中学习新词。",
    "tip": "write down useful sentences 记下有用的句子。"
  },
  {
    "id": "w50",
    "word": "rather than",
    "meaning": "短语 而不是",
    "pos": "短语",
    "optional": false,
    "example": "Focus on sentences rather than single words.",
    "translation": "关注句子，而不是孤立的单词。",
    "tip": "连接结构相互对应的两部分。"
  },
  {
    "id": "w51",
    "word": "pronunciation",
    "meaning": "n. 发音",
    "pos": "n.",
    "optional": false,
    "example": "Reading aloud helps my pronunciation.",
    "translation": "朗读有助于改善我的发音。",
    "tip": "pronounce → pronunciation，注意中间拼写变化。"
  },
  {
    "id": "w52",
    "word": "grammar",
    "meaning": "n. 语法",
    "pos": "n.",
    "optional": false,
    "example": "We learn grammar by using it.",
    "translation": "我们在运用中学习语法。",
    "tip": "learn grammar；语法总称一般不可数。"
  },
  {
    "id": "w53",
    "word": "slowly",
    "meaning": "adv. 慢速地；缓慢地",
    "pos": "adv.",
    "optional": false,
    "example": "Please speak more slowly.",
    "translation": "请说得再慢一点。",
    "tip": "slow + -ly；more slowly—most slowly。"
  },
  {
    "id": "w54",
    "word": "text",
    "meaning": "n. 文本；文章",
    "pos": "n.",
    "optional": false,
    "example": "Read the text and find the main idea.",
    "translation": "阅读文章并找出大意。",
    "tip": "read the text aloud 朗读文章。"
  },
  {
    "id": "w55",
    "word": "speech",
    "meaning": "n. 演讲；说话的能力",
    "pos": "n.",
    "optional": false,
    "example": "She gave a speech about learning.",
    "translation": "她作了一场关于学习的演讲。",
    "tip": "give a speech 作演讲；不要拼成 speach。"
  },
  {
    "id": "w56",
    "word": "aloud",
    "meaning": "adv. 出声地；大声地",
    "pos": "adv.",
    "optional": false,
    "example": "I read English aloud every morning.",
    "translation": "我每天早上朗读英语。",
    "tip": "read aloud：读出声音，不等于必须喊叫。"
  },
  {
    "id": "w57",
    "word": "pronounce",
    "meaning": "v. 发音",
    "pos": "v.",
    "optional": false,
    "example": "Can you pronounce this word correctly?",
    "translation": "你能正确读出这个词吗？",
    "tip": "pronounce words correctly；与名词 pronunciation 区分。"
  },
  {
    "id": "w58",
    "word": "correctly",
    "meaning": "adv. 正确地",
    "pos": "adv.",
    "optional": false,
    "example": "She answered the question correctly.",
    "translation": "她正确地回答了问题。",
    "tip": "correct + -ly；more correctly—most correctly。"
  },
  {
    "id": "w59",
    "word": "spelling",
    "meaning": "n. 拼写",
    "pos": "n.",
    "optional": false,
    "example": "Check the spelling before you finish.",
    "translation": "完成前检查一下拼写。",
    "tip": "check the spelling；a spelling mistake。"
  },
  {
    "id": "w60",
    "word": "to one's surprise",
    "meaning": "短语 令某人惊讶的是",
    "pos": "短语",
    "optional": false,
    "example": "To my surprise, he remembered every word.",
    "translation": "令我惊讶的是，他记住了每个词。",
    "tip": "one's 随人称变化：to my / her / our surprise。"
  },
  {
    "id": "w61",
    "word": "repeat",
    "meaning": "v. 重复",
    "pos": "v.",
    "optional": false,
    "example": "Could you repeat the sentence, please?",
    "translation": "请再说一遍这个句子，好吗？",
    "tip": "repeat a sentence；repeat myself 重复自己说过的话。"
  },
  {
    "id": "w62",
    "word": "tourist",
    "meaning": "n. 游客；观光者",
    "pos": "n.",
    "optional": false,
    "example": "I help foreign tourists in my free time.",
    "translation": "我在空闲时帮助外国游客。",
    "tip": "tour + -ist，表示人。"
  }
];
 const lessons=[
  {
    "id": "patterns",
    "title": "词汇运用：重点短语与句型",
    "pages": "Unit 3",
    "points": [
      "in order to do 说明目的；by doing 说明方法。",
      "spend time doing / on sth；about、in、for、on 等介词后接名词或 doing。",
      "as + 原级 + as possible；one of the + 最高级 + 可数名词复数。",
      "borrow from / return to；write it down；How about doing / Why not do。"
    ],
    "example": "I improve my English by reading aloud in order to speak more clearly.（我通过朗读提高英语，为的是说得更清楚。）",
    "questions": [
      {
        "prompt": "I read aloud in order to ___ my pronunciation.",
        "options": [
          "improve",
          "improving",
          "improved"
        ],
        "answer": "improve",
        "explain": "in order to 后接动词原形，表示目的。"
      },
      {
        "prompt": "He spends time ___ poems and is interested in ___ them.",
        "options": [
          "reading; writing",
          "to read; writing",
          "reading; write"
        ],
        "answer": "reading; writing",
        "explain": "两处分别由 spend time doing 和 interested in doing 决定。"
      },
      {
        "prompt": "学习建议及人物介绍，哪句两处都对？",
        "options": [
          "Practise as often as possible. One of the most successful learners is Li Hua.",
          "Practise as more often as possible. One of the most successful learners is Li Hua.",
          "Practise as often as possible. One of the most successful learner are Li Hua."
        ],
        "answer": "Practise as often as possible. One of the most successful learners is Li Hua.",
        "explain": "原级 often；复数 learners；one 对应 is。"
      }
    ]
  },
  {
    "id": "adverbs",
    "title": "语法：副词比较级与最高级",
    "pages": "Unit 3",
    "points": [
      "副词说明动作怎样进行；fast—faster，early—earlier，carefully—more carefully。",
      "well—better—best；badly—worse—worst；比较级可用 much 修饰。",
      "as + 副词原级 + as；比较级 + than；最高级与三者以上范围搭配。"
    ],
    "example": "Amy is a careful reader. She reads more carefully than before.（埃米是个细心的读者。她比以前读得更仔细。）",
    "questions": [
      {
        "prompt": "He is a ___ learner.",
        "options": [
          "careful",
          "carefully",
          "more carefully"
        ],
        "answer": "careful",
        "explain": "learner 是名词，用形容词 careful 修饰。"
      },
      {
        "prompt": "哪句比较结构正确？",
        "options": [
          "She performed much better than before.",
          "She performed more better than before.",
          "She performed very better than before."
        ],
        "answer": "She performed much better than before.",
        "explain": "better 已经是比较级，程度修饰可用 much。"
      },
      {
        "prompt": "学习记录：两人同样努力；三人中 Amy 阅读最快；Tom 几乎不迟到。哪组词正确？",
        "options": [
          "as hard as; fastest; hardly",
          "as harder as; faster; hard",
          "as hardly as; most faster; harder"
        ],
        "answer": "as hard as; fastest; hardly",
        "explain": "相等用原级 hard；三者之最用 fastest；几乎不用 hardly。"
      }
    ]
  },
  {
    "id": "reflexives",
    "title": "语法：反身代词",
    "pages": "Unit 3",
    "points": [
      "主语与动作涉及的“自己”是同一对象时，按人称选择反身代词。",
      "teach / enjoy / express oneself；by oneself 表独立；反身代词也可强调亲自。"
    ],
    "example": "My brother taught me English. I taught myself English.（哥哥教我英语。我自学英语。）",
    "questions": [
      {
        "prompt": "I taught ___ English.（我自学）",
        "options": [
          "myself",
          "me",
          "himself"
        ],
        "answer": "myself",
        "explain": "教与学是同一个 I，用 myself。"
      },
      {
        "prompt": "Ann, enjoy ___! Boys, enjoy ___ too!",
        "options": [
          "yourself; yourselves",
          "yourselves; yourself",
          "herself; themselves"
        ],
        "answer": "yourself; yourselves",
        "explain": "直接对一人用 yourself，对多人用 yourselves，不能按提及姓名改成第三人称。"
      },
      {
        "prompt": "我们自学后与另一组交流，哪句代词都对？",
        "options": [
          "We taught ourselves and shared ideas with them.",
          "We taught ourself and shared ideas with themselves.",
          "We taught themselves and shared ideas with ourselves."
        ],
        "answer": "We taught ourselves and shared ideas with them.",
        "explain": "题设主体是 we，自学用 ourselves；与另一组交流用 them。"
      }
    ]
  },
  {
    "id": "formation",
    "title": "语法：词形与后缀",
    "pages": "Unit 3",
    "points": [
      "learner / inventor / scientist；write 直接加 r 变为 writer；winner 双写 n。",
      "success—successful—successfully；pronounce—pronunciation；invent— invention / inventor。",
      "find—found；found（创建）—founded；teach—taught；feed—fed。"
    ],
    "example": "The winner is a young pianist. An inventor makes new things.（获胜者是一位年轻的钢琴家。发明家创造新的事物。）",
    "questions": [
      {
        "prompt": "learn 表示“学习者”的名词是？",
        "options": [
          "learner",
          "learnor",
          "learnist"
        ],
        "answer": "learner",
        "explain": "learner 使用 -er。"
      },
      {
        "prompt": "The ___ learner completed the work ___.",
        "options": [
          "successful; successfully",
          "successfully; successful",
          "success; successful"
        ],
        "answer": "successful; successfully",
        "explain": "前空修饰人用形容词，后空修饰完成动作用副词。"
      },
      {
        "prompt": "历史记录：两个世纪前创办学校，旅行途中找到资料。选正确词形。",
        "options": [
          "Two centuries ago they founded a school; during their journeys they found useful records.",
          "Two centurys ago they found a school; during their journies they founded useful records.",
          "Two centuries ago they finded a school; during their journeys they found useful records."
        ],
        "answer": "Two centuries ago they founded a school; during their journeys they found useful records.",
        "explain": "centuries、journeys 复数规则不同；创建与找到的过去式也不同。"
      }
    ]
  },
  {
    "id": "reading",
    "title": "阅读与写作：阅读与学习经历写作",
    "pages": "Unit 3",
    "points": [
      "用人物行动支持品质；区分有效方法与天赋，不能凭一句话扩大结论。",
      "学习经历按“困难→具体行动→进步与感悟”组织；过去经历主要用过去时。"
    ],
    "example": "He saw learning as an exciting journey and kept learning throughout his life.（他把学习看作一段令人兴奋的旅程，并终身坚持学习。）",
    "questions": [
      {
        "prompt": "人物只受过两年学校教育，却通过大量阅读自学。最支持哪项？",
        "options": [
          "主动学习",
          "从不阅读",
          "只靠课堂"
        ],
        "answer": "主动学习",
        "explain": "“通过大量阅读自学”是主动学习的直接证据。"
      },
      {
        "prompt": "哪段行动与困难对应最好？",
        "options": [
          "发音不清楚，所以每天跟读并比较录音",
          "发音不清楚，所以只整理书包",
          "发音不清楚，所以删去全部英语活动"
        ],
        "answer": "发音不清楚，所以每天跟读并比较录音",
        "explain": "跟读和比较录音直接针对发音问题。"
      },
      {
        "prompt": "班级要制定语言学习方案，哪组最符合“方法＋行动＋证据”？",
        "options": [
          "每天与伙伴交流，记录句子，每周比较表达进步",
          "只说自己有天赋，不安排练习",
          "照搬人物年龄作为学习计划"
        ],
        "answer": "每天与伙伴交流，记录句子，每周比较表达进步",
        "explain": "具体行动可执行，比较前后表现能检验进步，与本文方法相符。"
      }
    ]
  }
];
 (window.GrowingEnglishVocabulary||={})[3]=words;
 (window.GrowingEnglishLessons||={})[3]=lessons;
})();
