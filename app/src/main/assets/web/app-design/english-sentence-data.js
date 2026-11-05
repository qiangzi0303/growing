/* Original unit practice; typing points never count as course mastery. */
(function(root,factory){
  const content=typeof module==='object'&&module.exports?Object.assign({},require('./english-sentence-units-13.js'),require('./english-sentence-units-2.js'),require('./english-sentence-units-45.js'),require('./english-sentence-units-678.js')):root.SentenceUnitContent;
  const api=factory(content);if(typeof module==='object'&&module.exports)module.exports=api;else root.SentenceDemo=api;
})(globalThis,content=>{
  'use strict';
  const sentences=[
    {id:'club',title:'加入社团',level:'基础',zh:'我期待加入戏剧社。',en:'I look forward to joining the drama club.',chunks:['I','look forward to','joining the drama club.'],distractor:'join the drama club.',base:'join',gerund:'joining',hint:'“期待做某事”是 look forward to doing；这里的 to 是介词。',explanation:'look forward to 后接动名词：join → joining，不能写成 to join。'},
    {id:'friends',title:'结识朋友',level:'基础',zh:'我期待结识新朋友。',en:'I look forward to meeting new friends.',chunks:['I','look forward to','meeting new friends.'],distractor:'meet new friends.',base:'meet',gerund:'meeting',hint:'“结识新朋友”在这里要用 meeting new friends。',explanation:'to 在这个固定搭配中是介词，所以 meet 要变成 meeting。'},
    {id:'library',title:'参观图书馆',level:'基础',zh:'我们期待参观新的图书馆。',en:'We look forward to visiting the new library.',chunks:['We','look forward to','visiting the new library.'],distractor:'visit the new library.',base:'visit',gerund:'visiting',hint:'主语是 We，谓语用 look；参观用 visiting。',explanation:'We 后用 look forward to，介词 to 后接 visiting。the new library 指这座新的图书馆。'},
    {id:'story',title:'读你的故事',level:'基础',zh:'她期待阅读你的故事。',en:'She looks forward to reading your story.',chunks:['She','looks forward to','reading your story.'],distractor:'read your story.',base:'read',gerund:'reading',hint:'留意两个变化：She 后 looks；to 后 reading。',explanation:'一般现在时的第三人称单数用 looks；介词 to 后，read 要用动名词 reading。'},
    {id:'football',title:'课后踢球',level:'基础',zh:'他期待放学后踢足球。',en:'He looks forward to playing football after school.',chunks:['He','looks forward to','playing football','after school.'],distractor:'play football',base:'play',gerund:'playing',hint:'He 后用 looks；“放学后”是 after school。',explanation:'He looks forward to playing football：looks 与第三人称单数对应，playing 接在介词 to 后。'},
    {id:'teachers',title:'再见老师',level:'基础',zh:'他们期待再次见到老师们。',en:'They look forward to seeing their teachers again.',chunks:['They','look forward to','seeing their teachers','again.'],distractor:'see their teachers',base:'see',gerund:'seeing',hint:'“再次”用 again；“见到”在 to 后要用 seeing。',explanation:'They 是复数，使用 look。see 的动名词是 seeing，两个 e 都保留。'},
    {id:'play',title:'参加校园剧',level:'提高',zh:'我妹妹期待参加校园剧的演出。',en:'My sister looks forward to taking part in the school play.',chunks:['My sister','looks forward to','taking part in','the school play.'],distractor:'take part in',base:'take',gerund:'taking',hint:'“参加”是 take part in；take 变成 taking 时去掉末尾的 e。',explanation:'My sister 是第三人称单数，谓语用 looks。to 后的 take part in 变成 taking part in。'},
    {id:'letter',title:'盼望你的来信',level:'提高',zh:'我们期待很快收到你的来信。',en:'We look forward to hearing from you soon.',chunks:['We','look forward to','hearing from you','soon.'],distractor:'hear from you',base:'hear',gerund:'hearing',hint:'“收到某人的来信”是 hear from sb，在这里要写 hearing from you。',explanation:'hear from 表示收到某人的来信或消息，不能只译成“听见你”。它在 to 后变成 hearing from。'},
    {id:'help',title:'挑战困难',level:'难题',zh:'虽然这项工作很难，但我们期待帮助低年级学生。',en:'Although the work is difficult, we look forward to helping the younger students.',chunks:['Although the work is difficult,','we','look forward to','helping the younger students.'],distractor:'help the younger students.',base:'help',gerund:'helping',hint:'Although 引导让步从句；对应中文的“但”，英文主句不用再加 but。',explanation:'Although 与 but 不在同一句中重复引导。主句中 look forward to 后仍要接 helping。'},
    {id:'green',title:'共建绿色校园',level:'综合',zh:'我们班期待齐心协力，让校园更环保。',en:'Our class looks forward to working together to make our school greener.',chunks:['Our class','looks forward to','working together','to make our school greener.'],distractor:'work together',base:'work',gerund:'working',hint:'第一个 to 属于 look forward to，后接 working；第二个 to make 表示目的。',explanation:'本句把班级当作一个整体，用 looks。look forward to 后是 working；后面的 to make 是表示目的的不定式，不能把两个 to 混为一谈。'}
  ];
  const meanings={
    i:'我',look:'期待（与 forward to 连用）',looks:'期待（第三人称单数）',forward:'look forward to 的组成部分',joining:'加入',the:'这 / 那（定冠词）',drama:'戏剧',club:'社团',
    meeting:'结识',new:'新的',friends:'朋友们',we:'我们',visiting:'参观',library:'图书馆',she:'她',reading:'阅读',your:'你的',story:'故事',he:'他',playing:'踢 / 玩',football:'足球',after:'在……之后',school:'学校',
    they:'他们',seeing:'见到',their:'他们的',teachers:'老师们',again:'再次',my:'我的',sister:'妹妹 / 姐姐',taking:'参加（taking part in）',part:'taking part in 的组成部分',in:'taking part in 的组成部分',play:'戏剧',
    hearing:'收到消息（hearing from）',from:'来自（与 hearing 连用）',you:'你',soon:'很快',although:'虽然',work:'工作',is:'是',difficult:'困难的',helping:'帮助',younger:'年龄较小的',students:'学生们',
    our:'我们的',class:'班级',working:'工作 / 努力',together:'一起',make:'使 / 让',greener:'更环保的'
  };
  const lexicon={
    i:['aɪ','代词'],look:['lʊk','动词'],looks:['lʊks','动词'],forward:['ˈfɔːrwərd','副词'],to:['tuː','介词'],joining:['ˈdʒɔɪnɪŋ','动名词'],the:['ðə','冠词'],drama:['ˈdrɑːmə','名词'],club:['klʌb','名词'],
    meeting:['ˈmiːtɪŋ','动名词'],new:['nuː','形容词'],friends:['frendz','名词'],we:['wiː','代词'],visiting:['ˈvɪzɪtɪŋ','动名词'],library:['ˈlaɪbreri','名词'],she:['ʃiː','代词'],reading:['ˈriːdɪŋ','动名词'],your:['jʊr','限定词'],story:['ˈstɔːri','名词'],he:['hiː','代词'],playing:['ˈpleɪɪŋ','动名词'],football:['ˈfʊtbɔːl','名词'],after:['ˈæftər','介词'],school:['skuːl','名词'],
    they:['ðeɪ','代词'],seeing:['ˈsiːɪŋ','动名词'],their:['ðer','限定词'],teachers:['ˈtiːtʃərz','名词'],again:['əˈɡen','副词'],my:['maɪ','限定词'],sister:['ˈsɪstər','名词'],taking:['ˈteɪkɪŋ','动名词'],part:['pɑːrt','名词'],in:['ɪn','介词'],play:['pleɪ','名词'],
    hearing:['ˈhɪrɪŋ','动名词'],from:['frəm','介词'],you:['juː','代词'],soon:['suːn','副词'],although:['ɔːlˈðoʊ','连词'],work:['wɜːrk','名词'],is:['ɪz','系动词'],difficult:['ˈdɪfɪkəlt','形容词'],helping:['ˈhelpɪŋ','动名词'],younger:['ˈjʌŋɡər','形容词'],students:['ˈstuːdənts','名词'],
    our:['aʊr','限定词'],class:['klæs','名词'],working:['ˈwɜːrkɪŋ','动名词'],together:['təˈɡeðər','副词'],make:['meɪk','动词'],greener:['ˈɡriːnər','形容词']
  };
  const shortMeanings={look:'期待',looks:'期待',forward:'向前',to:'（介词）',the:'这 / 那',taking:'参加',part:'部分',in:'在……中',hearing:'收到消息',from:'来自',working:'努力'};
  const legacyRoles={club:['主语','谓语','宾语'],friends:['主语','谓语','宾语'],library:['主语','谓语','宾语'],story:['主语','谓语','宾语'],football:['主语','谓语','宾语','状语'],teachers:['主语','谓语','宾语','状语'],play:['主语','谓语','宾语','宾语'],letter:['主语','谓语','宾语','状语'],help:['状语','主语','谓语','宾语'],green:['主语','谓语','宾语','状语']};
  for(const s of sentences)s.groups=s.chunks.map((text,i)=>[legacyRoles[s.id][i],text]);
  const levels=['基础','基础','基础','基础','基础','基础','提高','提高','难题','综合'];
  const units={};
  for(const source of Object.values(content)){
    const id='english-8a-'+String(source.number).padStart(2,'0');
    const topics=source.number===2?[{id:'reading',title:'阅读：校园生活与期待',explanation:'结合校园活动练习 look forward to doing，注意介词 to 后接动名词。',sentences},...source.topics]:source.topics;
    units[id]={...source,id,topics:topics.map(t=>({...t,sentences:t.sentences.map((s,i)=>({...s,id:id+'-'+t.id+'-'+String(i+1).padStart(2,'0'),unit:id,topic:t.id,title:s.title||t.title+' · '+(i+1),level:levels[i],hint:s.hint||s.explanation||t.explanation,explanation:s.explanation||t.explanation}))}))};
  }
  const defaultSentences=units['english-8a-02'].topics[0].sentences;
  function getPractice(unitId,topicId){
    const legacy=unitId==null&&topicId==null;
    const key=legacy?'english-8a-02':unitId;
    const unit=Object.prototype.hasOwnProperty.call(units,key)?units[key]:undefined;
    if(!unit)return {error:'该单元暂无已核对的句子练习，请从英语目录选择已开放的上册单元。'};
    const backHref=unit.number===3?'../word-ops-unit3/index.html':'english-course.html?unit='+unit.id;
    if(topicId==null&&!legacy)return {unit,topic:null,backHref};
    const topic=unit.topics.find(t=>t.id===(legacy?'reading':topicId));
    if(!topic)return {unit,backHref,error:'这个知识点不存在，请返回本单元重新选择。'};
    return {unit,topic,sentences:topic.sentences,backHref:unit.number===3?backHref:backHref+'&lesson='+encodeURIComponent(topic.id)};
  }
  function wordPrompts(sentence){
    const words=sentence.en.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[];
    return words.map((en,index)=>{
      const key=en.toLowerCase(),legacy=sentence.topic==='reading'&&sentence.unit==='english-8a-02';
      const entry=units[sentence.unit]?.lexicon[key];
      const purpose=legacy&&key==='to'&&words[index-1]?.toLowerCase()!=='forward';
      const base=legacy?{zh:key==='to'?(purpose?'为了（表示目的）':'介词（look forward to）'):meanings[key],gloss:purpose?'为了':shortMeanings[key]||meanings[key],ipa:lexicon[key]?.[0]||'',pos:purpose?'不定式标记':lexicon[key]?.[1]||''}:{ipa:entry?.[0]||'',pos:entry?.[1]||'',zh:entry?.[2]||'',gloss:entry?.[2]||''};
      const override=sentence.wordOverrides?.[index]||sentence.wordOverrides?.[key];
      return {en,...base,...override,gloss:override?.gloss||override?.zh||base.gloss};
    });
  }
  function grammarGroups(sentence){
    const words=wordPrompts(sentence);let offset=0;
    return sentence.groups.map(([role,text])=>{const count=(text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]).length;const group={role,words:words.slice(offset,offset+count)};offset+=count;return group;});
  }
  const normalize=text=>String(text??'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[.!?,;:。！？、，；：]/g,' ').replace(/\s+/g,' ').trim();
  const matches=(sentence,answer)=>normalize(answer)===normalize(sentence.en);
  function typingState(expected,input){
    const typed=normalize(input),answer=normalize(expected);
    return !typed?'empty':typed===answer?'correct':answer.startsWith(typed)?'prefix':'wrong';
  }
  function feedback(sentence,answer){
    const text=normalize(answer);
    if(sentence.base&&new RegExp('\\bforward to '+sentence.base+'\\b').test(text))return '这里的 to 是介词，后面要用 '+sentence.gerund+'，不能用 '+sentence.base+'。';
    if(sentence.base&&/\bforward\b/.test(text)&&!/\bforward to\b/.test(text))return '固定搭配是 look forward to，别漏掉介词 to。';
    if(sentence.base&&/^(she|he|my sister|our class) look forward\b/.test(text))return '本句的主语按第三人称单数处理，一般现在时要用 looks forward to。';
    return '和本关练过的句子还不一致，请检查词序、词形和遗漏。'+sentence.explanation;
  }
  const points=record=>record.revealed?0:record.hints?40:record.wrong?60:100;
  const createRound=list=>({sentences:list.slice(),index:0,results:[]});
  function complete(round,record){
    if(round.results.length!==round.index)return false;
    round.results.push({id:round.sentences[round.index].id,wrong:record.wrong,hints:record.hints,revealed:record.revealed,points:points(record)});return true;
  }
  function next(round){if(round.results.length!==round.index+1||round.index+1>=round.sentences.length)return false;round.index++;return true;}
  function summary(round){
    let combo=0,bestCombo=0,independent=0;
    for(const result of round.results){if(result.points===100){combo++;independent++;bestCombo=Math.max(bestCombo,combo);}else combo=0;}
    return {score:round.results.reduce((sum,r)=>sum+r.points,0),independent,combo,bestCombo,completed:round.results.length,total:round.sentences.length};
  }
  return {sentences:defaultSentences,units,getPractice,wordPrompts,grammarGroups,typingState,normalize,matches,feedback,points,createRound,complete,next,summary};
});
