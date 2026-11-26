import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
import {radicalMath,courseMathHtml} from '../src/course-math.js';
const require=createRequire(import.meta.url),formatter=require('../../platform-web/math-format.js');

test('bracketed squared expressions stay entirely underneath the radical bar',()=>{
 const source='已知−1<x<3，化简√[(x+1)²]+√[(x−3)²]，并说明结果为何不依赖x。';
 const dom=new JSDOM(courseMathHtml(source,formatter));
 const roots=[...dom.window.document.querySelectorAll('msqrt')];
 assert.equal(roots.length,2);
 assert.deepEqual(roots.map(root=>root.textContent),['(x+1)2','(x−3)2']);
 assert.ok(roots.every(root=>root.querySelector('msup')?.lastElementChild.textContent==='2'));
 assert.equal(dom.window.document.querySelectorAll('.sqrt .hide-tail svg').length,2);
 assert.equal(dom.window.document.querySelector('.math-format-error'),null);
 dom.window.close();
});

test('all existing course radical expressions are typeset rather than left as bare symbols',()=>{
 const texts=new Set();
 function collect(value){
  if(typeof value==='string'&&/[√∛]/.test(value))texts.add(value);
  else if(value&&typeof value==='object')Object.values(value).forEach(collect);
 }
 for(const name of ['practice-math-upper','practice-math-lower','practice-physics','math-upper','math-lower'])collect(require('../../app/src/main/assets/web/app-design/'+name+'.js'));
 assert.ok(texts.size>0);
 for(const source of texts){
  assert.doesNotMatch(courseMathHtml(source,formatter),/math-format-error/,source);
  const prose=formatter.parts(radicalMath(source)).filter(p=>p.text).map(p=>p.text).join('');
  assert.doesNotMatch(prose,/[√∛]\s*[\da-zA-Zπ（(\[|]/,source);
 }
});
test('course radicals have a vinculum, including denominators and powers',()=>{
 const text='√(x−2)有意义要求x≥2；1/√(x−2)有意义则要求x>2。';
 const html=courseMathHtml(text,formatter);
 assert.equal((html.match(/<msqrt>/g)||[]).length,2);assert.match(html,/<mfrac>/);assert.doesNotMatch(html,/math-format-error/);
 for(const text of ['√a','√20','2√3','√(3²+4²)','∛8'])assert.match(courseMathHtml(text,formatter),/class="katex"/);
 assert.equal(radicalMath('\\(\\sqrt{x-2}\\)'), '\\(\\sqrt{x-2}\\)');
 assert.equal(radicalMath('√(x+'), '√(x+');
 assert.doesNotMatch(courseMathHtml('<img src=x onerror=alert(1)>√2',undefined),/<img/);
});

test('every course fraction is stacked, with radicals and grouped denominators kept intact',()=>{
 const examples=new Map([
  ['√(72/25)',String.raw`\(\sqrt{\frac{72}{25}}\)`],
  ['6√2/5',String.raw`\(\frac{6\sqrt{2}}{5}\)`],
  ['6√2/25',String.raw`\(\frac{6\sqrt{2}}{25}\)`],
  ['36√2/5',String.raw`\(\frac{36\sqrt{2}}{5}\)`],
  ['12/5',String.raw`\(\frac{12}{5}\)`],
  ['1200/120',String.raw`\(\frac{1200}{120}\)`],
  ['AB/AC',String.raw`\(\frac{AB}{AC}\)`],
  ['ab/2',String.raw`\(\frac{ab}{2}\)`],
  ['360°/240',String.raw`\(\frac{360^{\circ}}{240}\)`],
  ['频数/总数',String.raw`\(\frac{\text{频数}}{\text{总数}}\)`],
  ['路程差/速度',String.raw`\(\frac{\text{路程差}}{\text{速度}}\)`],
  ['Δs/Δt',String.raw`\(\frac{\Delta s}{\Delta t}\)`],
  ['（　）/(3b)',String.raw`\(\frac{(\quad)}{3b}\)`],
  ['1/(|x|−2)',String.raw`\(\frac{1}{\lvert x\rvert -2}\)`],
  ['(x+2)/[x(x−2)(x+2)]',String.raw`\(\frac{x+2}{x(x-2)(x+2)}\)`],
  ['(x+1)/(x−1)',String.raw`\(\frac{x+1}{x-1}\)`],
  ['x²/(x−1)',String.raw`\(\frac{x^{2}}{x-1}\)`],
  ['(1/2+1/3)/5',String.raw`\(\frac{\frac{1}{2}+\frac{1}{3}}{5}\)`],
  ['1/2/3',String.raw`\(\frac{\frac{1}{2}}{3}\)`],
  ['1/2÷1/3',String.raw`\(\frac{1}{2}\div \frac{1}{3}\)`],
  ['2×3/4',String.raw`\(2\times \frac{3}{4}\)`],
  ['(x²−1)/x÷(x+1)/x',String.raw`\(\frac{x^{2}-1}{x}\div \frac{x+1}{x}\)`],
  ['1÷(2/3)',String.raw`\(1\div (\frac{2}{3})\)`],
  ['√(x+1)²',String.raw`\(\sqrt{x+1}^{2}\)`]
 ]);
 for(const [source,expected] of examples){
  assert.equal(radicalMath(source),expected,source);
  const html=courseMathHtml(source,formatter);assert.doesNotMatch(html,/math-format-error/,source);
  if(source.includes('/'))assert.match(html,/<mfrac>/,source);
 }
 assert.equal(radicalMath('and/or，cm/s，https://example.test/12/5，2026/11/26'),'and/or，cm/s，https://example.test/12/5，2026/11/26');
 assert.equal(radicalMath(String.raw`\(\frac{1}{2}\)`),String.raw`\(\frac{1}{2}\)`);
 assert.doesNotMatch(courseMathHtml('<script>1/2</script>',formatter),/<script>/);
});
