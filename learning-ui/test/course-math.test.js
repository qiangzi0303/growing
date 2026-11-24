import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {radicalMath,courseMathHtml} from '../src/course-math.js';
const require=createRequire(import.meta.url),formatter=require('../../platform-web/math-format.js');
test('course radicals have a vinculum, including denominators and powers',()=>{
 const text='√(x−2)有意义要求x≥2；1/√(x−2)有意义则要求x>2。';
 const html=courseMathHtml(text,formatter);
 assert.equal((html.match(/<msqrt>/g)||[]).length,2);assert.match(html,/<mfrac>/);assert.doesNotMatch(html,/math-format-error/);
 for(const text of ['√a','√20','2√3','√(3²+4²)','∛8'])assert.match(courseMathHtml(text,formatter),/class="katex"/);
 assert.equal(radicalMath('\\(\\sqrt{x-2}\\)'), '\\(\\sqrt{x-2}\\)');
 assert.equal(radicalMath('√(x+'), '√(x+');
 assert.doesNotMatch(courseMathHtml('<img src=x onerror=alert(1)>√2',undefined),/<img/);
});
