import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildKnowledge, knowledgeContext} from '../src/student-knowledge';
import type {Document} from '../src/database';
import diagnosis from '../../app/src/main/assets/web/app-design/diagnosis-engine.js';
import graphs from '../src/diagnosis-rules.json';
import english from '../src/english-rules.json';
const doc=(key:string,value:any):Document=>({key,value:JSON.stringify(value),revision:1,updatedAt:'2026-10-31T10:00:00Z'});
const grade=(score:number)=>({score,feedback:'说明分母限制',criticalErrors:[],gaps:score<8?['原式分母不能为零']:[],at:'2026-10-30T10:00:00Z'});
const writtenGrade=(score=40,at='2026-10-30T10:00:00Z')=>({revision:1,at,source:'handwriting',needsReview:false,score:65,parts:[15,20,20,10],feedback:'核对作图条件',corrections:[{location:'第1页第2步',issue:'把中点误作垂足',correction:'中线必须连接顶点和对边中点'}],knowledge:[{nodeId:'tri-lines',score,feedback:'第1页第2步把对边中点误作垂足，中线不保证垂直。'}]});
const written=(grades:any[],revision=1)=>doc('growing-handwriting-v1:11111111-1111-1111-1111-111111111111',{version:1,unitId:'math-8a-01',subject:'math',mode:'solution',prompt:'作三角形的中线',pages:[[{tool:'pen',width:4,points:[[10,10,.5]]}]],revision,recognition:null,grades,updatedAt:'2026-10-31T10:00:00Z'});

test('mistake focus links the actual topic, preserves paper identity and never invents a cause from right/wrong logs',()=>{
  const p=buildKnowledge([], [
    {kind:'math',questionId:'q1',unitId:'math-8a-01',title:'利用中线求周长',number:3,wrongCount:2,lastCorrect:0},
    {kind:'photo',questionId:'q2',unitId:'math-8a-01',title:'中线作图',number:'7',paperTitle:'期中复习卷',wrongCount:1,lastCorrect:1},
    {kind:'photo',questionId:'q3',unitId:'math-8a-01',title:'一道未明确知识点的题',wrongCount:1,lastCorrect:0},
    {kind:'math',questionId:'q4',unitId:'physics-8a-01',title:'中线',wrongCount:1,lastCorrect:0},
  ]);
  const c=knowledgeContext(p,'math-8a-01','','tri-lines');
  assert.equal(c.mistakeFocus.length,2);assert.equal(c.mistakeFocus[0].status,'needs-review');
  assert.equal(c.mistakeFocus[1].paperTitle,'期中复习卷');assert.equal(c.mistakeFocus[1].questionNumber,'7');
  assert.equal(c.mistakeFocus[1].status,'latest-correct');assert.ok(c.mistakeFocus.every(m=>m.cause===null&&m.causeSource==='unrecorded'));
  assert.equal(knowledgeContext(p,'math-8a-01','','equilateral').mistakeFocus.length,0);
  assert.equal(knowledgeContext(p,'math-8a-01','','phy-source').mistakeFocus.length,0);
});

test('original handwriting feedback supplies the recorded cause, without raw strokes, answers or mastery changes',()=>{
  const p=buildKnowledge([written([writtenGrade()])]),c=knowledgeContext(p,'math-8a-01','','tri-lines');
  assert.equal(c.mistakeFocus.length,1);assert.equal(c.mistakeFocus[0].association,'graded-node');
  assert.equal(c.mistakeFocus[0].causeSource,'handwriting-node-feedback');assert.match(c.mistakeFocus[0].cause!,/第1页第2步.*中点误作垂足/);
  assert.equal(p.counts.mastered,0);assert.equal(p.topics.find(t=>t.id==='tri-lines')!.status,'unknown');
  assert.ok(!JSON.stringify(c).includes('"points"'));assert.ok(!JSON.stringify(c).includes('"pages"'));assert.ok(!JSON.stringify(c).includes('"answers"'));
});

test('later passing handwriting retains the historical cause; edits or uncertain grades do not claim current failure',()=>{
  const old=writtenGrade(),pass=writtenGrade(90,'2026-10-31T10:00:00Z');
  assert.equal(knowledgeContext(buildKnowledge([written([old,pass])]),'math-8a-01','','tri-lines').mistakeFocus[0].status,'latest-correct');
  assert.equal(knowledgeContext(buildKnowledge([written([old],2)]),'math-8a-01','','tri-lines').mistakeFocus[0].status,'historical');
  const review={revision:1,at:'2026-10-31T10:00:00Z',source:'handwriting',needsReview:true,score:null,parts:null,feedback:'原稿不清楚',corrections:[]};
  assert.equal(knowledgeContext(buildKnowledge([written([old,review])]),'math-8a-01','','tri-lines').mistakeFocus[0].status,'historical');
  const corrupted={...old,knowledge:[{nodeId:'phy-source',score:30,feedback:'wrong subject'}]};
  assert.equal(buildKnowledge([written([corrupted])]).mistakes.length,0);
});
test('unassessed topics are unknown; reading and self-written summaries never certify mastery',()=>{
  const p=buildKnowledge([doc('growing-math-lessons-v1',{topics:{'tri-lines':{seen:true,draft:'I know everything',bestQuiz:0}}}),doc('growing-student-notes-v1',{notes:[{id:'note',unitId:'math-8a-01',text:'全部掌握了',at:Date.now()}]})]);
  assert.equal(p.topics.find(t=>t.id==='tri-lines')!.status,'learning');
  assert.equal(p.topics.find(t=>t.id==='tri-angles')!.status,'unknown');
  assert.equal(p.counts.mastered,0);assert.equal(p.reminders.length,0);assert.equal(p.notes.length,1);
});
test('mastery requires both course conditions; later low evidence requests review while retaining historical pass',()=>{
  const p=buildKnowledge([doc('growing-math-lessons-v1',{topics:{'tri-lines':{attempts:[grade(8)],bestQuiz:3},'tri-angles':{attempts:[grade(8)],bestQuiz:2},'tri-inequality':{attempts:[grade(4)],bestQuiz:0},congruence:{attempts:[grade(9),{...grade(4),at:'2026-10-31T00:00:00Z'}],bestQuiz:3},foreign:{attempts:[grade(10)],bestQuiz:3}}})]);
  assert.equal(p.topics.find(t=>t.id==='tri-lines')!.status,'mastered');
  assert.equal(p.topics.find(t=>t.id==='tri-angles')!.status,'learning');
  assert.equal(p.topics.find(t=>t.id==='tri-inequality')!.status,'weak');
  assert.equal(p.topics.find(t=>t.id==='congruence')!.status,'review');
  assert.equal(p.topics.find(t=>t.id==='congruence')!.courseMastered,true);
  assert.equal(p.topics.some(t=>t.subject==='math'&&t.id==='foreign'),false);
});
test('English follows the existing word and lesson validators rather than flags or free-text claims',()=>{
  const l=english['english-8a-01'].lessons[0];
  const p=buildKnowledge([doc('growing-english-course-v1:english-8a-01',{words:{friendship:{protocol:'seven-recalls',answers:Array(7).fill('friendship')},honest:{mastered:true}},lessons:{[l.id]:{protocol:'three-correct',answers:l.answers}}})]);
  assert.equal(p.topics.find(t=>t.unitId==='english-8a-01'&&t.id==='friendship')!.courseMastered,true);
  assert.equal(p.topics.find(t=>t.unitId==='english-8a-01'&&t.id==='honest')!.courseMastered,false);
  assert.equal(p.topics.find(t=>t.unitId==='english-8a-01'&&t.id===l.id)!.courseMastered,true);
});
test('only complete graph paths identify weaknesses, never incomplete diagnosis',()=>{
  const g=diagnosis.graph(graphs.math);let s=diagnosis.createAssessment(g,['tri-lines']);
  const partial=buildKnowledge([doc('growing-diagnosis-v1:math-8a-01',{version:1,records:{'tri-lines':s}})]);
  assert.equal(partial.topics.find(t=>t.id==='tri-lines')!.diagnosis,null);
  while(diagnosis.inspect(g,s).next){const q=diagnosis.inspect(g,s).next.question;s=diagnosis.answer(g,s,q.id,(q.answer+1)%q.options.length);}
  const p=buildKnowledge([doc('growing-diagnosis-v1:math-8a-01',{version:1,records:{'tri-lines':s}})]);
  assert.equal(p.topics.find(t=>t.id==='tri-lines')!.status,'weak');
  assert.equal(p.topics.find(t=>t.id==='tri-lines')!.courseMastered,false);
});
test('latest-correct mistakes remain in history but do not generate an unresolved reminder',()=>{
  const p=buildKnowledge([],[{unitId:'math-8a-01',title:'solved',wrongCount:3,lastCorrect:1},{unitId:'math-8a-01',title:'open',wrongCount:2,lastCorrect:0}]);
  assert.equal(p.wrongQuestions.length,2);assert.deepEqual(p.reminders.map(r=>r.title),['open']);
});
test('context retrieval searches outside the current unit, caps topics and excludes raw answer payloads',()=>{
  const p=buildKnowledge([doc('growing-physics-lessons-v1',{topics:{'phy-source':{attempts:[grade(3)]}}})]);
  const c=knowledgeContext(p,'math-8a-01','声音来自振动');
  assert.ok(c.topics.some(t=>t.id==='phy-source'));assert.ok(c.topics.length<=32);
  assert.equal('answers' in c,false);assert.equal(c.totalTopics,p.topics.length);
});
test('broken records report limited coverage without exposing private contents',()=>{
  const p=buildKnowledge([{key:'growing-math-lessons-v1',value:'broken secret',revision:1,updatedAt:'2026-10-31T00:00:00Z'}]);
  assert.ok(p.warnings.length);assert.ok(!JSON.stringify(p).includes('broken secret'));assert.equal(p.counts.mastered,0);
});
