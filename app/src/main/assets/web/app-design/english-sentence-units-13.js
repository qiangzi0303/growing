/* Original practice based on the verified upper-term Unit 1 and Unit 3 lessons. */
(function(root,factory){const data=factory();if(typeof module==='object'&&module.exports)module.exports=data;else Object.assign(root.SentenceUnitContent||(root.SentenceUnitContent={}),data);})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const s=(en,zh,...groups)=>({en,zh,groups});
 const topic=(id,title,explanation,sentences)=>({id,title,explanation,sentences});
 const units={1:{number:1,title:'Friendship',topics:[
 topic('reading','用事例描写朋友','人物品质需要具体事例支持；help sb with sth表示帮助，make sb do中用动词原形。',[
 s('My friend is patient.','我的朋友很有耐心。',['主语','My friend'],['谓语','is'],['表语','patient']),
 s('She listens to me.','她听我倾诉。',['主语','She'],['谓语','listens'],['状语','to me']),
 s('He often tells jokes.','他经常讲笑话。',['主语','He'],['状语','often'],['谓语','tells'],['宾语','jokes']),
 s('My friend helps me with English.','我的朋友帮助我学习英语。',['主语','My friend'],['谓语','helps'],['宾语','me'],['状语','with English']),
 s('His jokes make us laugh.','他的笑话让我们发笑。',['主语','His jokes'],['谓语','make'],['宾语','us'],['宾补','laugh']),
 s('She always keeps my secrets.','她总是替我保密。',['主语','She'],['状语','always'],['谓语','keeps'],['宾语','my secrets']),
 s('My friend is kind and helps others.','我的朋友很善良，而且帮助别人。',['主语','My friend'],['谓语','is'],['表语','kind'],['连接词','and'],['谓语','helps'],['宾语','others']),
 s('When I feel worried, she listens patiently.','当我担心时，她耐心地听我倾诉。',['从句','When I feel worried'],['主语','she'],['谓语','listens'],['状语','patiently']),
 s('Although he is quiet, he always helps others.','虽然他很安静，但他总是帮助别人。',['从句','Although he is quiet'],['主语','he'],['状语','always'],['谓语','helps'],['宾语','others']),
 s('My friend makes me laugh when I feel worried.','当我担心时，我的朋友会逗我笑。',['主语','My friend'],['谓语','makes'],['宾语','me'],['宾补','laugh'],['从句','when I feel worried'])]),
 topic('forms','形容词比较形式','短形容词常加-er/-est；辅音+y变i；big双写g；长形容词用more/most；good和bad不规则变化。',[
 s('My friend is taller.','我的朋友更高。',['主语','My friend'],['谓语','is'],['表语','taller']),
 s('This room is bigger.','这个房间更大。',['主语','This room'],['谓语','is'],['表语','bigger']),
 s('She looks happier today.','她今天看起来更开心。',['主语','She'],['谓语','looks'],['表语','happier'],['状语','today']),
 s('This story is nicer.','这个故事更好。',['主语','This story'],['谓语','is'],['表语','nicer']),
 s('He is more careful now.','他现在更细心了。',['主语','He'],['谓语','is'],['表语','more careful'],['状语','now']),
 s('This idea is better.','这个主意更好。',['主语','This idea'],['谓语','is'],['表语','better']),
 s('The smallest room is the quietest.','最小的房间最安静。',['主语','The smallest room'],['谓语','is'],['表语','the quietest']),
 s('This story is worse than that story.','这个故事比那个故事更差。',['主语','This story'],['谓语','is'],['表语','worse'],['状语','than that story']),
 s('This story is more interesting, but that story is the funniest.','这个故事更有趣，但那个故事最滑稽。',['主语','This story'],['谓语','is'],['表语','more interesting'],['连接词','but'],['主语','that story'],['谓语','is'],['表语','the funniest']),
 s('My best friend is happier and more careful now.','我最好的朋友现在更开心，也更细心了。',['主语','My best friend'],['谓语','is'],['表语','happier and more careful'],['状语','now'])]),
 topic('comparison','比较范围与句型','两方比较用比较级；范围中最突出用最高级；one of后接最高级和复数名词；比较同类事物。',[
 s('She is taller than me.','她比我高。',['主语','She'],['谓语','is'],['表语','taller'],['状语','than me']),
 s('His bag is heavier than mine.','他的包比我的重。',['主语','His bag'],['谓语','is'],['表语','heavier'],['状语','than mine']),
 s('Her hair is longer than mine.','她的头发比我的长。',['主语','Her hair'],['谓语','is'],['表语','longer'],['状语','than mine']),
 s('This book is much better.','这本书好得多。',['主语','This book'],['谓语','is'],['表语','much better']),
 s('She is the tallest in our class.','她是我们班最高的。',['主语','She'],['谓语','is'],['表语','the tallest'],['状语','in our class']),
 s('He is the youngest of the three.','他是三人中年龄最小的。',['主语','He'],['谓语','is'],['表语','the youngest'],['状语','of the three']),
 s('My friend is a little taller than me.','我的朋友比我高一点。',['主语','My friend'],['谓语','is'],['表语','a little taller'],['状语','than me']),
 s('She is one of the kindest students.','她是最善良的学生之一。',['主语','She'],['谓语','is'],['表语','one of the kindest students']),
 s('Her hair is much longer than mine, but mine is thicker.','她的头发比我的长得多，但我的更浓密。',['主语','Her hair'],['谓语','is'],['表语','much longer'],['状语','than mine'],['连接词','but'],['主语','mine'],['谓语','is'],['表语','thicker']),
 s('My best friend is one of the most helpful students in our class.','我最好的朋友是我们班最乐于助人的学生之一。',['主语','My best friend'],['谓语','is'],['表语','one of the most helpful students'],['状语','in our class'])]),
 topic('suffixes','后缀与人物描写','-ful与-less构成形容词；bored说人的感受，boring说令人厌烦的事物；ready后用to do。',[
 s('My friend is helpful.','我的朋友乐于助人。',['主语','My friend'],['谓语','is'],['表语','helpful']),
 s('He is careful with books.','他小心爱护书本。',['主语','He'],['谓语','is'],['表语','careful'],['状语','with books']),
 s('That careless boy lost his bag.','那个粗心的男孩丢了他的包。',['主语','That careless boy'],['谓语','lost'],['宾语','his bag']),
 s('The story is boring.','这个故事令人厌烦。',['主语','The story'],['谓语','is'],['表语','boring']),
 s('I feel bored now.','我现在感到无聊。',['主语','I'],['谓语','feel'],['表语','bored'],['状语','now']),
 s('She is ready to help.','她乐意帮忙。',['主语','She'],['谓语','is'],['表语','ready to help']),
 s('A helpful friend keeps your secrets.','乐于助人的朋友会替你保密。',['主语','A helpful friend'],['谓语','keeps'],['宾语','your secrets']),
 s('I feel bored because the story is boring.','我感到无聊，因为这个故事令人厌烦。',['主语','I'],['谓语','feel'],['表语','bored'],['从句','because the story is boring']),
 s('Although he feels hopeless, his helpful friend encourages him.','虽然他感到无望，但他乐于助人的朋友鼓励他。',['从句','Although he feels hopeless'],['主语','his helpful friend'],['谓语','encourages'],['宾语','him']),
 s('My careful friend keeps my secrets and is always ready to help others.','我细心的朋友替我保密，而且总是乐意帮助别人。',['主语','My careful friend'],['谓语','keeps'],['宾语','my secrets'],['连接词','and'],['谓语','is'],['状语','always'],['表语','ready to help others'])])],lexicon:{}},
 3:{number:3,title:'To be a good learner',topics:[
 topic('patterns','学习短语与句型','区分目的in order to do与方法by doing；spend time doing；介词后用doing；as…as possible用原级。',[
 s('I read aloud every day.','我每天朗读。',['主语','I'],['谓语','read'],['状语','aloud every day']),
 s('She learns by reading.','她通过阅读来学习。',['主语','She'],['谓语','learns'],['状语','by reading']),
 s('Read as carefully as possible.','尽可能仔细地读。',['谓语','Read'],['状语','as carefully as possible']),
 s('I spend ten minutes reading.','我花十分钟阅读。',['主语','I'],['谓语','spend'],['宾语','ten minutes'],['状语','reading']),
 s('He is curious about learning.','他对学习充满好奇。',['主语','He'],['谓语','is'],['表语','curious'],['状语','about learning']),
 s('Please write them down.','请把它们记下来。',['状语','Please'],['谓语','write'],['宾语','them'],['状语','down']),
 s('I read aloud in order to improve my pronunciation.','我朗读是为了改善发音。',['主语','I'],['谓语','read'],['状语','aloud'],['状语','in order to improve my pronunciation']),
 s('Please focus on learning useful sentences rather than single words.','请专注于学习有用的句子，而不是孤立的单词。',['状语','Please'],['谓语','focus'],['状语','on learning useful sentences rather than single words']),
 s('I borrow books from friends in order to learn useful sentences.','我向朋友们借书，为了学习有用的句子。',['主语','I'],['谓语','borrow'],['宾语','books'],['状语','from friends'],['状语','in order to learn useful sentences']),
 s('I spend ten minutes reading aloud in order to improve my pronunciation.','我花十分钟朗读，以改善我的发音。',['主语','I'],['谓语','spend'],['宾语','ten minutes'],['状语','reading aloud'],['状语','in order to improve my pronunciation'])]),
 topic('adverbs','副词的比较形式','副词说明动作方式；fast/hard/early用-er/-est，多数较长副词用more/most；well变better/best。',[
 s('She reads carefully.','她读得仔细。',['主语','She'],['谓语','reads'],['状语','carefully']),
 s('He works harder now.','他现在更努力了。',['主语','He'],['谓语','works'],['状语','harder now']),
 s('I arrived earlier today.','我今天到得更早。',['主语','I'],['谓语','arrived'],['状语','earlier today']),
 s('Please speak more slowly.','请说得更慢一些。',['状语','Please'],['谓语','speak'],['状语','more slowly']),
 s('She reads faster than me.','她比我读得快。',['主语','She'],['谓语','reads'],['状语','faster than me']),
 s('He speaks English better now.','他现在英语说得更好了。',['主语','He'],['谓语','speaks'],['宾语','English'],['状语','better now']),
 s('She reads the most carefully of the three.','三人中，她读得最仔细。',['主语','She'],['谓语','reads'],['状语','the most carefully of the three']),
 s('I pronounce words more correctly than before.','我发单词的音比以前更准确。',['主语','I'],['谓语','pronounce'],['宾语','words'],['状语','more correctly than before']),
 s('Although he reads slowly, he answers questions the most carefully.','虽然他读得慢，但他回答问题最仔细。',['从句','Although he reads slowly'],['主语','he'],['谓语','answers'],['宾语','questions'],['状语','the most carefully']),
 s('I work as hard as my friend, but she reads much faster.','我和我的朋友一样努力，但她读得快得多。',['主语','I'],['谓语','work'],['状语','as hard as my friend'],['连接词','but'],['主语','she'],['谓语','reads'],['状语','much faster'])]),
 topic('reflexives','反身代词','主语与动作涉及的自己相对应；单数-self、复数-selves；teach oneself自学，by oneself独立完成。',[
 s('I teach myself English.','我自学英语。',['主语','I'],['谓语','teach'],['间接宾语','myself'],['直接宾语','English']),
 s('She taught herself Italian.','她自学了意大利语。',['主语','She'],['谓语','taught'],['间接宾语','herself'],['直接宾语','Italian']),
 s('He made the card himself.','他亲手做了这张卡片。',['主语','He'],['谓语','made'],['宾语','the card'],['强调语','himself']),
 s('We enjoyed ourselves.','我们玩得很开心。',['主语','We'],['谓语','enjoyed'],['宾语','ourselves']),
 s('They taught themselves English.','他们自学了英语。',['主语','They'],['谓语','taught'],['间接宾语','themselves'],['直接宾语','English']),
 s('Please express yourself clearly.','请清楚地表达你自己的想法。',['状语','Please'],['谓语','express'],['宾语','yourself'],['状语','clearly']),
 s('We set goals for ourselves every week.','我们每周为自己设定目标。',['主语','We'],['谓语','set'],['宾语','goals'],['状语','for ourselves every week']),
 s('Children, please help yourselves to some fruit.','孩子们，请随便吃些水果。',['称呼','Children'],['状语','please'],['谓语','help'],['宾语','yourselves'],['状语','to some fruit']),
 s('She taught herself English by recording herself every day.','她通过每天给自己录音来自学英语。',['主语','She'],['谓语','taught'],['间接宾语','herself'],['直接宾语','English'],['状语','by recording herself every day']),
 s('We taught ourselves English and made these cards by ourselves.','我们自学了英语，并独立制作了这些卡片。',['主语','We'],['谓语','taught'],['间接宾语','ourselves'],['直接宾语','English'],['连接词','and'],['谓语','made'],['宾语','these cards'],['状语','by ourselves'])]),
 topic('formation','词形与后缀','辨别learner/inventor等表示人的名词；success/successful/successfully词性不同；found创建与find的过去式不同。',[
 s('She is a good learner.','她是一名善于学习的人。',['主语','She'],['谓语','is'],['表语','a good learner']),
 s('The inventor made a printer.','这位发明家制造了一台打印机。',['主语','The inventor'],['谓语','made'],['宾语','a printer']),
 s('He is a successful writer.','他是一位成功的作家。',['主语','He'],['谓语','is'],['表语','a successful writer']),
 s('The winner is a pianist.','这位获胜者是一位钢琴家。',['主语','The winner'],['谓语','is'],['表语','a pianist']),
 s('She finished the task successfully.','她成功地完成了任务。',['主语','She'],['谓语','finished'],['宾语','the task'],['状语','successfully']),
 s('Reading aloud improves pronunciation.','朗读能改善发音。',['主语','Reading aloud'],['谓语','improves'],['宾语','pronunciation']),
 s('The scientist shared a useful invention.','这位科学家分享了一项有用的发明。',['主语','The scientist'],['谓语','shared'],['宾语','a useful invention']),
 s('They founded a club and found new friends.','他们创办了一个俱乐部，并找到了新朋友。',['主语','They'],['谓语','founded'],['宾语','a club'],['连接词','and'],['谓语','found'],['宾语','new friends']),
 s('The successful inventor explained his invention clearly to the tourists.','这位成功的发明家向游客们清楚地解释了他的发明。',['主语','The successful inventor'],['谓语','explained'],['宾语','his invention'],['状语','clearly to the tourists']),
 s('The young learner became a writer and shared her learning journey successfully.','这位年轻的学习者成为了作家，并成功地分享了她的学习旅程。',['主语','The young learner'],['谓语','became'],['表语','a writer'],['连接词','and'],['谓语','shared'],['宾语','her learning journey'],['状语','successfully'])]),
 topic('reading','阅读与学习经历','结合自学、探究与分享理解终身学习；写经历按困难、行动、进步组织；过去经历主要用过去时。',[
 s('Learning is a lifelong journey.','学习是一场终身的旅程。',['主语','Learning'],['谓语','is'],['表语','a lifelong journey']),
 s('Good learners ask questions.','善于学习的人会提问题。',['主语','Good learners'],['谓语','ask'],['宾语','questions']),
 s('I learn words in sentences.','我在句子中学习单词。',['主语','I'],['谓语','learn'],['宾语','words'],['状语','in sentences']),
 s('She wrote down useful sentences.','她记下了有用的句子。',['主语','She'],['谓语','wrote down'],['宾语','useful sentences']),
 s('He shared his inventions for free.','他免费分享了他的发明。',['主语','He'],['谓语','shared'],['宾语','his inventions'],['状语','for free']),
 s('I was worried about pronunciation.','我曾担心自己的发音。',['主语','I'],['谓语','was'],['表语','worried'],['状语','about pronunciation']),
 s('I recorded my voice and listened carefully every day.','我每天给自己的声音录音，并仔细听。',['主语','I'],['谓语','recorded'],['宾语','my voice'],['连接词','and'],['谓语','listened'],['状语','carefully every day']),
 s('After two months, I could speak more clearly.','两个月后，我能说得更清楚了。',['状语','After two months'],['主语','I'],['谓语','could speak'],['状语','more clearly']),
 s('Although pronunciation was hard for me, I kept practising every day.','虽然发音对我来说很难，但我每天坚持练习。',['从句','Although pronunciation was hard for me'],['主语','I'],['谓语','kept practising'],['状语','every day']),
 s('By learning words in sentences, I improved my pronunciation and became more confident.','通过在句子中学习单词，我改善了发音，也变得更自信了。',['状语','By learning words in sentences'],['主语','I'],['谓语','improved'],['宾语','my pronunciation'],['连接词','and'],['谓语','became'],['表语','more confident'])])],lexicon:{}}};
 const lexicon={};
 // A shared dictionary is copied into each unit, keeping the modules independent.
 const add=(rows)=>rows.forEach(([w,ipa,pos,zh])=>lexicon[w]=[ipa,pos,zh]);
 add([
 ['a','ə','冠词','一个'],['the','ðə','冠词','特指已知的人或物'],['my','maɪ','物主限定词','我的'],['his','hɪz','物主限定词','他的'],['her','hɜː','物主限定词','她的'],['your','jɔː','物主限定词','你的'],['our','aʊə','物主限定词','我们的'],['this','ðɪs','限定词','这个'],['that','ðæt','限定词','那个'],['these','ðiːz','限定词','这些'],['i','aɪ','代词','我'],['he','hiː','代词','他'],['she','ʃiː','代词','她'],['we','wiː','代词','我们'],['they','ðeɪ','代词','他们'],['me','miː','代词','我（宾格）'],['us','ʌs','代词','我们（宾格）'],['him','hɪm','代词','他（宾格）'],['them','ðem','代词','他们（宾格）'],['mine','maɪn','物主代词','我的（东西）'],['others','ˈʌðəz','代词','其他人'],
 ['is','ɪz','系动词','是；处于'],['was','wɒz','系动词','曾是；曾处于'],['and','ænd','连词','而且；并且'],['but','bʌt','连词','但是'],['although','ɔːlˈðəʊ','连词','虽然'],['when','wen','连词','当……时'],['because','bɪˈkɒz','连词','因为'],['to','tuː','介词或不定式标记','向；用于动词原形前'],['with','wɪð','介词','和；在……方面'],['in','ɪn','介词','在……里面'],['of','ɒv','介词','……的；在……之中'],['than','ðæn','介词或连词','比'],['as','æz','副词或连词','像……一样'],['by','baɪ','介词','通过；独自时与反身代词搭配'],['for','fɔː','介词','为；对于'],['from','frɒm','介词','从'],['on','ɒn','介词','在……上；按'],['about','əˈbaʊt','介词','关于；对'],['after','ˈɑːftə','介词','在……之后'],['before','bɪˈfɔː','副词','以前'],['how','haʊ','副词','怎样'],['rather','ˈrɑːðə','副词','宁可；与比较词连用表示而不是'],['order','ˈɔːdə','名词','顺序；在目的短语中使用'],
 ['friend','frend','名词','朋友'],['friends','frendz','名词','朋友们'],['patient','ˈpeɪʃnt','形容词','有耐心的'],['patiently','ˈpeɪʃntli','副词','耐心地'],['listens','ˈlɪsnz','动词','倾听（第三人称单数）'],['listened','ˈlɪsnd','动词','听了'],['often','ˈɒfn','副词','经常'],['always','ˈɔːlweɪz','副词','总是'],['tells','telz','动词','讲述（第三人称单数）'],['jokes','dʒəʊks','名词','笑话'],['helps','helps','动词','帮助（第三人称单数）'],['help','help','动词','帮助；随便取用'],['english','ˈɪŋɡlɪʃ','名词','英语'],['make','meɪk','动词','使；制作'],['makes','meɪks','动词','使（第三人称单数）'],['laugh','lɑːf','动词','笑'],['keeps','kiːps','动词','保守；保持'],['secrets','ˈsiːkrəts','名词','秘密'],['kind','kaɪnd','形容词','善良的'],['feel','fiːl','系动词','感到'],['feels','fiːlz','系动词','感到（第三人称单数）'],['worried','ˈwʌrid','形容词','担心的'],['quiet','ˈkwaɪət','形容词','安静的'],['taller','ˈtɔːlə','形容词比较级','更高的'],['room','ruːm','名词','房间'],['bigger','ˈbɪɡə','形容词比较级','更大的'],['looks','lʊks','系动词','看起来'],['happier','ˈhæpiə','形容词比较级','更开心的'],['today','təˈdeɪ','副词','今天'],['story','ˈstɔːri','名词','故事'],['nicer','ˈnaɪsə','形容词比较级','更好的'],['more','mɔː','副词','更；构成长词比较级'],['careful','ˈkeəfl','形容词','细心的'],['now','naʊ','副词','现在'],['idea','aɪˈdɪə','名词','主意'],['better','ˈbetə','形容词或副词比较级','更好'],['smallest','ˈsmɔːlɪst','形容词最高级','最小的'],['quietest','ˈkwaɪətɪst','形容词最高级','最安静的'],['worst','wɜːst','形容词最高级','最差的'],['less','les','副词','较不'],['interesting','ˈɪntrəstɪŋ','形容词','有趣的'],['funniest','ˈfʌniɪst','形容词最高级','最滑稽的'],['best','best','形容词最高级','最好的'],['bag','bæɡ','名词','包'],['heavier','ˈheviə','形容词比较级','更重的'],['hair','heə','名词','头发'],['longer','ˈlɒŋɡə','形容词比较级','更长的'],['book','bʊk','名词','书'],['books','bʊks','名词','书籍'],['much','mʌtʃ','副词','……得多'],['tallest','ˈtɔːlɪst','形容词最高级','最高的'],['class','klɑːs','名词','班级'],['youngest','ˈjʌŋɡɪst','形容词最高级','年龄最小的'],['three','θriː','数词','三'],['little','ˈlɪtl','形容词','少量的'],['one','wʌn','数词','一'],['kindest','ˈkaɪndɪst','形容词最高级','最善良的'],['students','ˈstjuːdnts','名词','学生们'],['thicker','ˈθɪkə','形容词比较级','更浓密的'],['most','məʊst','副词','最；构成长词最高级'],['helpful','ˈhelpfl','形容词','乐于助人的'],['careless','ˈkeələs','形容词','粗心的'],['boy','bɔɪ','名词','男孩'],['lost','lɒst','动词','丢失了'],['boring','ˈbɔːrɪŋ','形容词','令人厌烦的'],['bored','bɔːd','形容词','感到无聊的'],['ready','ˈredi','形容词','准备好的；乐意的'],['hopeless','ˈhəʊpləs','形容词','无望的'],['encourages','ɪnˈkʌrɪdʒɪz','动词','鼓励（第三人称单数）'],
 ['read','riːd','动词','阅读（原形）'],['reads','riːdz','动词','阅读（第三人称单数）'],['reading','ˈriːdɪŋ','动名词','阅读'],['aloud','əˈlaʊd','副词','出声地'],['every','ˈevri','限定词','每一个'],['day','deɪ','名词','天'],['learns','lɜːnz','动词','学习（第三人称单数）'],['learning','ˈlɜːnɪŋ','动名词','学习'],['learn','lɜːn','动词','学习'],['carefully','ˈkeəfəli','副词','仔细地'],['possible','ˈpɒsəbl','形容词','可能的'],['spend','spend','动词','花费'],['ten','ten','数词','十'],['minutes','ˈmɪnɪts','名词','分钟'],['curious','ˈkjʊəriəs','形容词','好奇的'],['please','pliːz','副词','请'],['write','raɪt','动词','写'],['down','daʊn','副词','向下；与写搭配表示记下'],['improve','ɪmˈpruːv','动词','改善'],['pronunciation','prəˌnʌnsiˈeɪʃn','名词','发音'],['useful','ˈjuːsfl','形容词','有用的'],['sentences','ˈsentənsɪz','名词','句子'],['single','ˈsɪŋɡl','形容词','单个的'],['words','wɜːdz','名词','单词'],['borrow','ˈbɒrəʊ','动词','借入'],['return','rɪˈtɜːn','动词','归还'],['time','taɪm','名词','时间'],['works','wɜːks','动词','努力工作（第三人称单数）'],['work','wɜːk','动词','工作；努力'],['harder','ˈhɑːdə','副词比较级','更努力地'],['arrived','əˈraɪvd','动词','到达了'],['earlier','ˈɜːliə','副词比较级','更早地'],['speak','spiːk','动词','说'],['speaks','spiːks','动词','说（第三人称单数）'],['slowly','ˈsləʊli','副词','缓慢地'],['faster','ˈfɑːstə','副词比较级','更快地'],['pronounce','prəˈnaʊns','动词','发音'],['correctly','kəˈrektli','副词','正确地'],['answers','ˈɑːnsəz','动词','回答（第三人称单数）'],['questions','ˈkwestʃənz','名词','问题'],['hard','hɑːd','副词或形容词','努力地；困难的'],['teach','tiːtʃ','动词','教'],['myself','maɪˈself','反身代词','我自己'],['herself','hɜːˈself','反身代词','她自己'],['himself','hɪmˈself','反身代词','他自己'],['ourselves','aʊəˈselvz','反身代词','我们自己'],['themselves','ðəmˈselvz','反身代词','他们自己'],['yourself','jɔːˈself','反身代词','你自己'],['yourselves','jɔːˈselvz','反身代词','你们自己'],['taught','tɔːt','动词','教了'],['italian','ɪˈtæliən','名词','意大利语'],['made','meɪd','动词','制作了'],['card','kɑːd','名词','卡片'],['cards','kɑːdz','名词','卡片（复数）'],['enjoyed','ɪnˈdʒɔɪd','动词','享受了'],['express','ɪkˈspres','动词','表达'],['clearly','ˈklɪəli','副词','清楚地'],['set','set','动词','设定'],['goals','ɡəʊlz','名词','目标'],['week','wiːk','名词','星期'],['children','ˈtʃɪldrən','名词','孩子们'],['some','sʌm','限定词','一些'],['fruit','fruːt','名词','水果'],['recording','rɪˈkɔːdɪŋ','动名词','录音'],['good','ɡʊd','形容词','好的；善于……的'],['learner','ˈlɜːnə','名词','学习者'],['inventor','ɪnˈventə','名词','发明家'],['printer','ˈprɪntə','名词','打印机'],['successful','səkˈsesfl','形容词','成功的'],['writer','ˈraɪtə','名词','作家'],['winner','ˈwɪnə','名词','获胜者'],['pianist','ˈpɪənɪst','名词','钢琴家'],['finished','ˈfɪnɪʃt','动词','完成了'],['task','tɑːsk','名词','任务'],['successfully','səkˈsesfəli','副词','成功地'],['improves','ɪmˈpruːvz','动词','改善（第三人称单数）'],['scientist','ˈsaɪəntɪst','名词','科学家'],['shared','ʃeəd','动词','分享了'],['invention','ɪnˈvenʃn','名词','发明'],['inventions','ɪnˈvenʃnz','名词','发明（复数）'],['founded','ˈfaʊndɪd','动词','创建了'],['club','klʌb','名词','俱乐部'],['found','faʊnd','动词','找到了'],['new','njuː','形容词','新的'],['explained','ɪkˈspleɪnd','动词','解释了'],['tourists','ˈtʊərɪsts','名词','游客们'],['young','jʌŋ','形容词','年轻的'],['became','bɪˈkeɪm','系动词','变成了'],['journey','ˈdʒɜːni','名词','旅程'],['lifelong','ˈlaɪflɒŋ','形容词','终身的'],['learners','ˈlɜːnəz','名词','学习者们'],['ask','ɑːsk','动词','提问'],['wrote','rəʊt','动词','写了'],['free','friː','形容词','免费的'],['recorded','rɪˈkɔːdɪd','动词','录制了'],['voice','vɔɪs','名词','声音'],['two','tuː','数词','二'],['months','mʌnθs','名词','月（复数）'],['could','kʊd','情态动词','过去能够'],['kept','kept','动词','保持；坚持（过去式）'],['practising','ˈpræktɪsɪŋ','动名词','练习'],['improved','ɪmˈpruːvd','动词','改善了'],['confident','ˈkɒnfɪdənt','形容词','自信的']
 ]);
 add([['worse','wɜːs','形容词比较级','更差的'],['focus','ˈfəʊkəs','动词','集中注意力']]);
 // Resolve the adjective/adverb distinction in these two different contexts.
 units[3].topics.find(t=>t.id==='reading').sentences[8].wordOverrides={hard:{ipa:'hɑːd',pos:'形容词',zh:'困难的',gloss:'困难的'}};
 units[3].topics.find(t=>t.id==='adverbs').sentences[9].wordOverrides={hard:{ipa:'hɑːd',pos:'副词',zh:'努力地',gloss:'努力地'}};
 for(const unit of Object.values(units))unit.lexicon={...lexicon};
 return units;
});
