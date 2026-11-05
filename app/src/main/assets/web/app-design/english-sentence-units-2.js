/* Original practice based on the verified Unit 2 lessons, not textbook quotations. */
(function(root,factory){const data=factory();if(typeof module==='object'&&module.exports)module.exports=data;else Object.assign(root.SentenceUnitContent||(root.SentenceUnitContent={}),data);})(globalThis,()=>{
  const s=(zh,groups,explanation)=>({en:groups.map(g=>g[1]).join(' ')+'.',zh,groups,explanation});
  const data={2:{number:2,title:'School life',topics:[
    {id:'amount',title:'数量比较：more / fewer / less',explanation:'可数名词复数用 more / fewer，不可数名词用 more / less；最高级分别为 the most、the fewest、the least。先判断名词是否可数，再比较数量。',sentences:[
      s('我们今天有更多的课。',[['主语','We'],['谓语','have'],['宾语','more lessons'],['状语','today']],'lessons 是可数名词复数，more 表示更多。'),
      s('我妹妹的考试比我少。',[['主语','My sister'],['谓语','has'],['宾语','fewer tests'],['状语','than I do']],'tests 可数，用 fewer；than I do 用 do 代替 have tests。'),
      s('我们今天的家庭作业更少。',[['主语','We'],['谓语','have'],['宾语','less homework'],['状语','today']],'homework 不可数，不能加 s，数量较少用 less。'),
      s('汤姆需要更多的时间。',[['主语','Tom'],['谓语','needs'],['宾语','more time']],'time 表示时间时不可数；more 也能修饰不可数名词。'),
      s('我们班的学生比他们班少。',[['主语','Our class'],['谓语','has'],['宾语','fewer students'],['状语','than theirs']],'theirs 指 their class，比较的是两个班的学生人数。'),
      s('她的空闲时间比我少。',[['主语','She'],['谓语','has'],['宾语','less free time'],['状语','than I do']],'time 不可数，因此是 less free time。'),
      s('在这三个班中，我们班的考试最少。',[['主语','Our class'],['谓语','has'],['宾语','the fewest tests'],['状语','among the three classes']],'三个班中比较，用最高级 the fewest，修饰可数名词 tests。'),
      s('在这三名学生中，汤姆的家庭作业最少。',[['主语','Tom'],['谓语','has'],['宾语','the least homework'],['状语','among the three students']],'homework 不可数，最高级用 the least。'),
      s('我们今天的课更少，所以有更多的时间阅读。',[['主语','We'],['谓语','have'],['宾语','fewer lessons'],['状语','today,'],['连接词','so'],['主语','we'],['谓语','have'],['宾语','more time to read']],'lessons 用 fewer，time 用 more；so 连接原因和结果，不再加 because。'),
      s('我理想中的学校有更少的考试和更少的家庭作业。',[['主语','My ideal school'],['谓语','has'],['宾语','fewer tests and less homework']],'同一句中，tests 可数用 fewer，homework 不可数用 less，不能一律用 fewer。')
    ]},
    {id:'equality',title:'同级比较：as … as',explanation:'as + 形容词或副词原级 + as 表示同级比较；as many + 可数名词复数 + as 和 as much + 不可数名词 + as 表示数量相同。否定可用 not as … as。',sentences:[
      s('我的学校和你的学校一样大。',[['主语','My school'],['谓语','is'],['表语','as big as yours']],'as 与 as 之间用原级 big，yours 指 your school。'),
      s('她和她姐姐一样高。',[['主语','She'],['谓语','is'],['表语','as tall as her sister']],'同级比较用 tall，不能写 taller。'),
      s('这本书和那本书一样有趣。',[['主语','This book'],['谓语','is'],['表语','as interesting as that one']],'interesting 是原级；that one 代替那本书。'),
      s('我们的家庭作业和你们的一样多。',[['主语','We'],['谓语','have'],['宾语','as much homework as you do']],'homework 不可数，同样多用 as much … as。'),
      s('我和汤姆有同样多的书。',[['主语','I'],['谓语','have'],['宾语','as many books as Tom does']],'books 可数复数，用 as many；Tom 是第三人称单数，用 does。'),
      s('这间教室没有那间教室大。',[['主语','This classroom'],['谓语','is not'],['表语','as big as that one']],'not as big as 表示不如……大，big 仍用原级。'),
      s('我们没有他们那么多的测试。',[['主语','We'],['谓语','do not have'],['宾语','as many tests as they do']],'否定数量比较仍按名词选择 many；do not 后用 have 原形。'),
      s('我没有她那么多的空闲时间。',[['主语','I'],['谓语','do not have'],['宾语','as much free time as she does']],'free time 不可数，用 much；she 后的替代动词是 does。'),
      s('虽然我们的学校和他们的一样大，但我们的学生更少。',[['从句','Although our school is as big as theirs,'],['主语','we'],['谓语','have'],['宾语','fewer students']],'从句用 as big as 比较大小；主句用 fewer 比较人数。Although 不与 but 重复连接。'),
      s('我理想中的学校和我目前的学校一样大，但它的测试更少。',[['主语','My ideal school'],['谓语','is'],['表语','as big as my current school,'],['连接词','but'],['主语','it'],['谓语','has'],['宾语','fewer tests']],'先用 as big as 比较大小，再用 fewer tests 提出校园改进目标。')
    ]},
    {id:'writing',title:'写作：理想校园',explanation:'描写理想校园时说明希望改变什么，并给出理由。suggest doing 表示建议做某事，provide sth for sb 表示为某人提供某物，offer sth to sb 表示向某人提供某物。',sentences:[
      s('我们学校提供新鲜的食物。',[['主语','Our school'],['谓语','provides'],['宾语','fresh food']],'school 为第三人称单数，谓语用 provides。'),
      s('老师向我们提供帮助。',[['主语','The teacher'],['谓语','offers'],['宾语','help'],['状语','to us']],'offer help to sb 表示向某人提供帮助；help 在此不可数。'),
      s('我建议开办一个阅读俱乐部。',[['主语','I'],['谓语','suggest'],['宾语','starting a reading club']],'suggest 后接 doing；starting 是动名词。'),
      s('我们需要更多的时间运动。',[['主语','We'],['谓语','need'],['宾语','more time for sports']],'more time for sports 表示更多用于运动的时间。'),
      s('我理想中的学校有一个大图书馆。',[['主语','My ideal school'],['谓语','has'],['宾语','a big library']],'用 has 描写学校设施；library 前用 a。'),
      s('我们学校为学生提供书籍。',[['主语','Our school'],['谓语','provides'],['宾语','books'],['状语','for students']],'provide books for students，介词用 for。'),
      s('我建议课后一起阅读。',[['主语','I'],['谓语','suggest'],['宾语','reading together after school']],'suggest reading，而非 suggest to read；after school 表示放学后。'),
      s('我们需要更多的空闲时间，因为我们想参加社团。',[['主语','We'],['谓语','need'],['宾语','more free time'],['从句','because we want to join clubs']],'先提出需要，再用 because 给理由；want 后接 to join。'),
      s('如果我们的家庭作业更少，我们就能花更多时间阅读。',[['从句','If we have less homework,'],['主语','we'],['谓语','can spend'],['宾语','more time reading']],'if 引导条件；less homework 与 spend time doing 结合表达改进的效果。'),
      s('我建议开办一个戏剧社，让学生们能够结识新朋友。',[['主语','I'],['谓语','suggest'],['宾语','starting a drama club'],['从句','so that students can meet new friends']],'建议用 suggest doing；so that 从句解释目的，can 后用 meet 原形。')
    ]}
  ],lexicon:{
    we:['wiː','代词','我们'],have:['hæv','动词','有'],more:['mɔː','限定词','更多的'],lessons:['ˈlesənz','名词','课'],today:['təˈdeɪ','副词','今天'],my:['maɪ','限定词','我的'],sister:['ˈsɪstə','名词','姐姐 / 妹妹'],has:['hæz','动词','有'],fewer:['ˈfjuːə','限定词','更少的（可数）'],tests:['tests','名词','测试'],than:['ðæn','连词','比'],i:['aɪ','代词','我'],do:['duː','助动词','代替前面的动作'],less:['les','限定词','更少的（不可数）'],homework:['ˈhəʊmwɜːk','名词','家庭作业'],tom:['tɒm','专有名词','汤姆'],needs:['niːdz','动词','需要'],time:['taɪm','名词','时间'],our:['aʊə','限定词','我们的'],class:['klɑːs','名词','班级'],students:['ˈstjuːdənts','名词','学生们'],theirs:['ðeəz','代词','他们的（班级）'],she:['ʃiː','代词','她'],free:['friː','形容词','空闲的'],the:['ðə','冠词','这 / 那'],fewest:['ˈfjuːɪst','限定词','最少的（可数）'],among:['əˈmʌŋ','介词','在……之中'],three:['θriː','数词','三'],classes:['ˈklɑːsɪz','名词','班级（复数）'],least:['liːst','限定词','最少的（不可数）'],so:['səʊ','连词','所以'],to:['tə','不定式标记','用于引出动词原形'],read:['riːd','动词','阅读'],ideal:['aɪˈdɪəl','形容词','理想的'],school:['skuːl','名词','学校'],and:['ænd','连词','和'],is:['ɪz','系动词','是'],as:['æz','副词 / 连词','和……一样'],big:['bɪɡ','形容词','大的'],yours:['jɔːz','代词','你的（学校）'],tall:['tɔːl','形容词','高的'],her:['hɜː','限定词','她的'],this:['ðɪs','限定词','这'],book:['bʊk','名词','书'],interesting:['ˈɪntrəstɪŋ','形容词','有趣的'],that:['ðæt','代词 / 连词','那 / 引导从句'],one:['wʌn','代词','一本 / 一间（代替前文名词）'],much:['mʌtʃ','限定词','多的（不可数）'],you:['juː','代词','你 / 你们'],many:['ˈmeni','限定词','多的（可数）'],books:['bʊks','名词','书（复数）'],does:['dʌz','助动词','代替前面的动作（三单）'],classroom:['ˈklɑːsruːm','名词','教室'],not:['nɒt','副词','不'],they:['ðeɪ','代词','他们'],although:['ɔːlˈðəʊ','连词','虽然'],schools:['skuːlz','名词','学校（复数）'],are:['ɑː','系动词','是'],each:['iːtʃ','限定词','每个（与other组成彼此）'],other:['ˈʌðə','代词','另一个（与each组成彼此）'],now:['naʊ','副词','现在'],but:['bʌt','连词','但是'],it:['ɪt','代词','它'],provides:['prəˈvaɪdz','动词','提供'],fresh:['freʃ','形容词','新鲜的'],food:['fuːd','名词','食物'],teacher:['ˈtiːtʃə','名词','老师'],offers:['ˈɒfəz','动词','提供'],help:['help','名词','帮助'],us:['ʌs','代词','我们（宾格）'],suggest:['səˈdʒest','动词','建议'],starting:['ˈstɑːtɪŋ','动名词','开办'],a:['ə','冠词','一个'],reading:['ˈriːdɪŋ','名词 / 动名词','阅读'],club:['klʌb','名词','社团'],need:['niːd','动词','需要'],for:['fɔː','介词','为 / 用于'],sports:['spɔːts','名词','运动'],library:['ˈlaɪbrəri','名词','图书馆'],together:['təˈɡeðə','副词','一起'],after:['ˈɑːftə','介词','在……之后'],because:['bɪˈkɒz','连词','因为'],want:['wɒnt','动词','想要'],join:['dʒɔɪn','动词','加入'],clubs:['klʌbz','名词','社团（复数）'],if:['ɪf','连词','如果'],can:['kæn','情态动词','能够'],spend:['spend','动词','花费'],drama:['ˈdrɑːmə','名词','戏剧'],meet:['miːt','动词','结识'],new:['njuː','形容词','新的'],friends:['frendz','名词','朋友们']
  }}};
  data[2].lexicon.current=['ˈkʌrənt','形容词','目前的'];
  const topics=data[2].topics;
  topics.find(t=>t.id==='writing').sentences[1].wordOverrides={to:{pos:'介词',zh:'向',gloss:'向'}};
  for(const sentence of topics.find(t=>t.id==='equality').sentences.slice(6,8))sentence.wordOverrides={1:{pos:'助动词',zh:'构成否定的助动词',gloss:'构成否定的助动词'}};
  return data;
});
