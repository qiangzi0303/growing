const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const math=require('../platform-web/math-format.js');
test('standard math preserves fractions, radicals, subscripts, cases and operation order',()=>{
  const source=String.raw`计算 \(\left(1-\frac{1}{x+1}\right)\div\frac{x^2}{x^2-1}\)。\[\sqrt[3]{216}+S_{n+1}\]`;
  assert.equal(math.normalize(source),source);
  const html=math.html(source);
  assert.match(html,/<math/);assert.match(html,/<mfrac>/);assert.match(html,/<mroot>/);assert.match(html,/<msub>/);
  assert.equal(math.normalize('文字题目，无参考答案。'),'文字题目，无参考答案。');
  assert.equal(math.normalize('Choose and/or and keep the unit cm/s.'),'Choose and/or and keep the unit cm/s.');
  assert.equal(math.normalize('$x^2$'),String.raw`\(x^2\)`);
});
test('invalid formulas and image or HTML math commands cannot become question records',()=>{
  for(const value of [String.raw`\(\frac{x}{\)`,String.raw`\(x`,String.raw`\(\href{javascript:alert(1)}{x}\)`,String.raw`\(\includegraphics{secret}\)`,String.raw`\(\def\a{\a}\a\)`,'![question](https://example.test/x.png)','data:image/png;base64,AA==','<img src=x>','计算 x²=1','计算 a/b'])assert.throws(()=>math.normalize(value),value);
  assert.doesNotMatch(math.html('<script>alert(1)</script>'),/<script>/);
  assert.match(math.html(String.raw`\(\unknowncommand{x}\)`),/公式待核对/);
});
test('all 53 historical records render as standard math, preserving identity and uncertainty',()=>{
  const ad=path.resolve(__dirname,'../app/src/main/assets/web/app-design'),context={window:{}};
  for(const name of ['math-wrong-questions-transcribed.js','math-wrong-questions-data.js'])vm.runInNewContext(fs.readFileSync(path.join(ad,name),'utf8'),context);
  const data=context.window.GrowingMathWrongQuestions;
  assert.equal(data.questions.length,53);
  for(const [i,q] of data.questions.entries()){
    assert.equal(q.id,'1025141010-'+String(i+1).padStart(2,'0'));
    assert.equal(q.format,math.version);assert.equal(q.image,undefined);assert.ok(q.text.length>10);
    assert.equal(math.normalize(q.text),q.text,'question '+q.number);
    assert.doesNotMatch(math.html(q.text),/math-format-error|<img\b/,'question '+q.number);
  }
  assert.match(data.questions[36].text,/不是已核对的参考答案/);
  assert.match(data.questions[52].text,/【原题遮挡】/);
  for(const n of [1,12,19,29,31,33,34,35,45,47,52])assert.match(data.questions[n-1].text,/不清楚|缺少|缺损/);
});
