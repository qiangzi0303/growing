import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validatePaper} from '../src/question-bank';
import {normalizePractice,practiceCatalog} from '../src/photo-practice';

test('photo knowledge classification uses actual subject/unit IDs and bounded confidence',()=>{
 const node=practiceCatalog('math').find(n=>n.unitId==='math-8a-01')!;
 const practice={nodeId:node.id,level:'basic'};
 assert.deepEqual(normalizePractice(practice,'math',node.unitId),practice);
 assert.equal(normalizePractice(practice,'english',node.unitId),null);
 assert.equal(normalizePractice(practice,'math','math-8a-03'),null);
 const input={format:'math-text-v1',title:'Paper',warnings:[],questions:[{number:'1',text:'Question',answer:'',unitId:node.unitId,confidence:.9,reason:'topic',uncertain:[],pages:[1],questionType:'choice',practice}]};
 assert.deepEqual(validatePaper(input,1)?.questions[0].practice,practice);
 for(const confidence of [.7,1.1,'high']){
  assert.equal(validatePaper({...input,questions:[{...input.questions[0],practice:{...practice,confidence}}]},1)?.questions[0].practice,null);
 }
});
