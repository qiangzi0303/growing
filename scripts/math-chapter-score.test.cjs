const assert=require('node:assert/strict');
const S=require('../app/src/main/assets/web/app-design/math-chapter-score.js'),E=require('../app/src/main/assets/web/app-design/reward-engine.js');
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
const nodes=[{id:'a',title:'勾股定理'},{id:'b',title:'逆定理'},{id:'c',title:'应用'}];
const full={feynman:10,practice:{score:10,total:10},ms:20*60000,mastered:true};
test('empty chapter with no wrong questions scores only the wrong bonus',()=>{const s=S.compute(nodes,()=>({}),[],{});assert.equal(s.score,20);assert.equal(s.progress.done,160);});
test('feynman 40 / practice 50 / time 10 per point',()=>{const s=S.compute(nodes,id=>id==='a'?{feynman:5,practice:{score:6,total:10},ms:10*60000}:{},['w'],{});assert.equal(s.items[0].score.toFixed(4),(80/3*(0.4*0.5+0.5*0.6+0.1*0.5)).toFixed(4));});
test('time beyond target earns nothing extra',()=>assert.equal(S.compute(nodes,()=>({ms:999*60000}),['w'],{}).pointScore,8));
test('all mastered and all wrong conquered gives 100 and full reward',()=>{const s=S.compute(nodes,()=>full,['w'],{w:{analyzed:'2026-11-20',redo:'2026-11-21',correct:true}});assert.equal(s.score,100);assert.equal(s.cleared,true);assert.deepEqual(s.progress,{done:1000,total:1000});});
test('clear bonus 20% only when every point mastered',()=>{const s=S.compute(nodes,id=>id==='c'?{...full,mastered:false}:full,[],{});assert.equal(s.score,100);assert.equal(s.progress.done,800);});
test('same-day redo is not a conquest',()=>assert.equal(S.conquered({analyzed:'2026-11-20',redo:'2026-11-20',correct:true}),false));
test('redo flow requires analysis then a later day',()=>{const m=new Map(),st={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};assert.throws(()=>S.redo(st,'q',true,Date.parse('2026-11-21T10:00')));S.analyzed(st,'q',Date.parse('2026-11-20T10:00'));assert.throws(()=>S.redo(st,'q',true,Date.parse('2026-11-20T20:00')));S.redo(st,'q',true,Date.parse('2026-11-21T10:00'));assert.equal(S.conquered(S.loadWrong(st).q),true);});
test('math ledger: 62 points unmastered gives 49 minutes and 99.2 yuan',()=>{let d=E.restore(null,null,{key:'math-score-v1',gameMinutes:100,cashYuan:200});d=E.accrue(d,496,1000);assert.deepEqual(E.amounts(d),{game:49,cash:9920,availableGame:49,availableCash:9920});});
test('unredeemed old 120/200 math ledger migrates once to 100/200',()=>{const def={key:'math-score-v1',gameMinutes:100,cashYuan:200};const old=E.restore(null);const d=E.restore(JSON.parse(JSON.stringify(old)),null,def);assert.equal(d.config.gameMinutes,100);const custom=E.restore({...E.configure(E.restore(null,null,def),120,200),defaultsKey:'math-score-v1'},null,def);assert.equal(custom.config.gameMinutes,120);});
test('redeemed old ledger keeps its locked budget',()=>{const old=E.redeem(E.accrue(E.restore(null),1,2),'cash','妈妈');assert.equal(E.restore(JSON.parse(JSON.stringify(old)),null,{key:'math-score-v1',gameMinutes:100,cashYuan:200}).config.gameMinutes,120);});
test('migration preserves earned game time and does not shrink a larger existing promise',()=>{
 const defaults={key:'math-score-v1',gameMinutes:100,cashYuan:200};
 const old=E.accrue(E.restore(null),8,10),next=E.restore(old,null,defaults);
 assert.equal(next.config.gameMinutes,100);assert.equal(E.amounts(next).game,96);
 assert.equal(E.amounts(E.restore(next,null,defaults)).game,96);
 const full=E.restore(E.accrue(E.restore(null),1,1),null,defaults);assert.equal(E.amounts(full).game,120);
 const custom=E.configure(E.restore(null),120,200);assert.equal(E.restore(custom,null,defaults).config.gameMinutes,120);
});
test('best evidence survives worse attempts, reload and excludes a changed question set',()=>{
 const P=require('../app/src/main/assets/web/app-design/practice-progress.js'),F=require('../app/src/main/assets/web/app-design/math-feedback.js');
 const round=score=>({version:1,total:10,at:'2026-11-25T00:00:00Z',items:Array.from({length:10},(_,i)=>({id:'a-application-'+(i+1),type:i<8?'choice':'solution',...(i<8?{choice:0,passed:i<score}:{unanswered:true,choice:null,score:null,passed:false})}))});
 let record={attempts:[{score:10,criticalErrors:[],feedback:'准确'}],practiceRound:round(8)};
 record={...record,...S.keepBest(record,{attempts:[{score:3,criticalErrors:[],feedback:'遗漏'}],practiceRound:round(2)},P,F.validGrade)};
 record=JSON.parse(JSON.stringify(record));
 const summary=S.fromRecords([{id:'a',title:'知识点'}],{a:record},{days:{}},[],{},P,F.validGrade);
 assert.equal(summary.items[0].feynman,10);assert.equal(summary.items[0].practiceRatio,.8);assert.equal(summary.score,84);
 record.practiceSet=Array(10).fill('new-photo-version');
 assert.equal(S.fromRecords([{id:'a',title:'知识点'}],{a:record},{days:{}},[],{},P,F.validGrade).items[0].practiceRatio,0);
});
test('unreadable wrong records cannot be silently overwritten',()=>assert.throws(()=>S.analyzed({getItem:()=>'{broken',setItem:()=>assert.fail('must preserve original')},'q')));
console.log(`PASS ${count} math chapter score cases`);
