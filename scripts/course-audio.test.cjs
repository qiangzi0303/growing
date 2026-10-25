const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const dir=path.resolve(__dirname,'../app/src/main/assets/web/app-design');
const box={window:{}};
for(const f of ['math-audio.js','physics-audio.js','english-audio.js','english-vocabulary.js','english-lessons.js'])vm.runInNewContext(fs.readFileSync(path.join(dir,f),'utf8'),box);
const asset=(a)=>{assert(a,'missing packaged audio');assert(a.duration>.15);const bytes=fs.readFileSync(path.join(dir,a.file));assert(bytes.length>1000);if(a.audioSha256)assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.audioSha256);};
test('every regular math and physics lesson has its own packaged audio',()=>{
 const M=require('../app/src/main/assets/web/app-design/math-data.js'),P=require('../app/src/main/assets/web/app-design/physics-data.js');
 for(const n of M.chapters.filter(c=>c.number!==10).flatMap(c=>c.nodes))asset(box.window.GrowingMathAudio[n.id]);
 for(const n of P.nodes)asset(box.window.GrowingPhysicsAudio[n.id]);
 assert.equal(Object.keys(box.window.GrowingMathAudio).length,57);assert.equal(Object.keys(box.window.GrowingPhysicsAudio).length,40);
});
test('all English word, example and original Unit 3 playback texts are covered',()=>{
 for(const words of Object.values(box.window.GrowingEnglishVocabulary))for(const w of words)asset(box.window.GrowingEnglishAudio[w.word]);
 for(const lessons of Object.values(box.window.GrowingEnglishLessons))for(const l of lessons)asset(box.window.GrowingEnglishAudio[l.example.split('（')[0]]);
 const html=fs.readFileSync(path.join(dir,'../word-ops-unit3/index.html'),'utf8');
 const script=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('window.UNIT3 ='));
 vm.runInNewContext(script[1],box);
 for(const w of box.window.UNIT3.words){asset(box.window.GrowingEnglishAudio[({w17:'set apart',w48:'as often as possible',w60:'to my surprise'})[w.id]||w.en]);asset(box.window.GrowingEnglishAudio[w.ex]);}
 assert.equal(Object.keys(box.window.GrowingEnglishAudio).length,539);
});
test('packaged playback respects rate, cancels stale callbacks and never needs device voices',async()=>{
 const audios=[],messages=[];
 class Audio{constructor(src){this.src=src;audios.push(this);}play(){return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){delete this.src;}load(){}}
 const scope={window:{},Audio,URL,document:{baseURI:'https://example.com/learn/app-design/math-course.html'}};
 vm.runInNewContext(fs.readFileSync(path.join(dir,'course-speech.js'),'utf8'),scope);
 const player=scope.window.GrowingCourseSpeech.create({assets:{x:{file:'math-audio/x.mp3'}},onStatus:t=>messages.push(t)});
 player.play({id:'x'},{rate:.7});assert.equal(audios[0].playbackRate,.7);audios[0].onplaying();assert(messages.at(-1).includes('正在播放内置'));
 player.stop();const count=messages.length;audios[0].onended();audios[0].onerror();assert.equal(messages.length,count);assert(audios[0].paused);
 player.play({id:'missing'});assert(messages.at(-1).includes('内置音频暂未加载'));assert.equal(audios.length,1);
});
test('partial rubric items and explicit gaps are marked while full-score feedback stays neutral',()=>{
 const F=require('../app/src/main/assets/web/app-design/math-feedback.js');
 const d={score:8.5,comment:'还可补充',criticalErrors:[],good:['已理解概念'],gaps:['补充使用条件'],followup:'再举例',criteria:[{id:'core',score:4,evidence:'原话',feedback:'概念正确'},{id:'condition',score:.5,evidence:'部分条件',feedback:'少了条件'},{id:'example',score:2,evidence:'例子',feedback:'例子正确'},{id:'boundary',score:2,evidence:'边界',feedback:'边界正确'}]};
 const html=F.render(d);assert(html.includes('class="assessment-gap assessment-gap-note">待巩固：少了条件'));assert(html.includes('<li class="assessment-gap">补充使用条件'));assert(html.includes('<p class="">概念正确</p>'));
});
for(const file of ['../fraction-ops/分式作战_一分钟学习版.html','../word-ops-unit3/index.html'])test('legacy inline scripts compile: '+file,()=>{
 const html=fs.readFileSync(path.join(dir,file),'utf8');for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
});
