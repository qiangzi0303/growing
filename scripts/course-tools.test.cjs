const {test}=require('node:test');
const assert=require('node:assert/strict');
const T=require('../app/src/main/assets/web/app-design/course-tools.js');
test('calendar aggregates activity by local day and only counts first complete mastery',()=>{
  const d=T.empty(),at=new Date(2026,9,21,12).getTime();
  T.log(d,'sound',{kind:'read'},at);T.log(d,'sound',{kind:'grade',score:9},at);
  assert.equal(T.totals(d,T.day(at),['sound']).newCount,0);
  T.log(d,'sound',{kind:'practice',correct:3,total:3,mastered:true},at);
  T.log(d,'sound',{kind:'grade',score:10,mastered:true},at+86400000);
  T.log(d,'sound',{kind:'time',ms:12000},at);
  const round=T.restore(JSON.parse(JSON.stringify(d)));
  assert.equal(T.totals(round,T.day(at),['sound']).newCount,1);
  assert.equal(T.totals(round,T.day(at+86400000),['sound']).newCount,0);
  assert.equal(T.totals(round,T.day(at),['sound']).ms,12000);
  assert.equal(round.days[T.day(at)].sound.total,3);
});
test('chapter reset removes only its calendar, mastery and conversations',()=>{
  const d=T.empty();for(const id of ['sound','light']){T.log(d,id,{kind:'grade',score:9,mastered:true});d.doubts[id]={draft:id,messages:[{role:'assistant',text:'解释',at:''}]};}
  const next=T.reset(d,['sound']);assert.equal(next.mastery.sound,undefined);assert.equal(next.doubts.sound,undefined);
  assert.equal(next.doubts.light.draft,'light');assert.equal(T.totals(next,T.day(),['light']).grades,1);
  assert.equal(d.doubts.sound.draft,'sound');
});
test('bad versions are rejected; unknown dates are preserved without invented timestamps',()=>{
  assert.throws(()=>T.restore({version:99}));
  const d=T.empty();d.mastery.old=null;assert.equal(T.restore(d).mastery.old,null);
  assert.equal(T.day('invalid'),null);assert.equal(T.format(65000),'1分5秒');
});
