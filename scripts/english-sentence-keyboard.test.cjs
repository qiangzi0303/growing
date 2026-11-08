const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('../console-web/node_modules/jsdom');
const assets=path.join(__dirname,'../app/src/main/assets/web/app-design');

function mount(t,mobile=true){
  const dom=new JSDOM(fs.readFileSync(path.join(assets,'english-sentence-demo.html'),'utf8'),{
    url:'https://test.invalid/english-sentence-demo.html?unit=english-8a-02&topic=reading',runScripts:'outside-only'
  });
  t.after(()=>dom.window.close());
  const w=dom.window;
  w.matchMedia=()=>({matches:mobile});
  for(const name of ['english-sentence-units-13','english-sentence-units-2','english-sentence-units-45','english-sentence-units-678','english-sentence-data','english-sentence-progress','english-sentence-demo']){
    w.eval(fs.readFileSync(path.join(assets,name+'.js'),'utf8'));
  }
  const doc=w.document,editor=doc.querySelector('#typing-answer');
  doc.querySelector('[data-action=start]').click();
  const key=(key,extra={})=>editor.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...extra}));
  const input=(data,inputType='insertText',extra={})=>{
    const options={data,inputType,bubbles:true,...extra};
    const allowed=editor.dispatchEvent(new w.InputEvent('beforeinput',{cancelable:true,...options}));
    if(allowed&&!editor.readOnly){
      editor.value+=inputType==='insertText'?data:'\n';
      editor.dispatchEvent(new w.InputEvent('input',options));
    }
    return allowed;
  };
  const fill=value=>{editor.value=value;editor.dispatchEvent(new w.InputEvent('input',{inputType:'insertText',bubbles:true}));};
  const sentence=w.SentenceDemo.getPractice('english-8a-02','reading').sentences[0];
  return {w,doc,editor,key,input,fill,sentence,words:w.SentenceDemo.wordPrompts(sentence),
    progress:()=>doc.querySelector('[role=progressbar]').getAttribute('aria-valuenow'),
    points:()=>doc.querySelector('#points').textContent};
}

test('mobile keeps the editor editable and advances once with Space or Enter keydown',t=>{
  const h=mount(t);
  for(const key of [' ','Enter']){
    h.fill(h.words[Number(h.progress())].en);h.key('Enter');
    assert.equal(h.editor.readOnly,false,'keep the mobile keyboard available after a correct answer');
    assert.equal(h.doc.activeElement,h.editor);
    const progress=Number(h.progress()),points=h.points();
    h.key(key);
    assert.equal(h.progress(),String(progress+1));assert.equal(h.points(),points);
    assert.equal(h.editor.value,'');assert.equal(h.doc.activeElement,h.editor);
    assert.equal(h.doc.querySelector('#typing-answer'),h.editor);
    h.key(key,{repeat:true});assert.equal(h.progress(),String(progress+1));
    assert.equal(h.doc.querySelector('.feedback').textContent,'');
  }
});

test('mobile advances on text and newline input without keydown, including noncancelable input',t=>{
  for(const [data,type,cancelable] of [[' ','insertText',true],[null,'insertLineBreak',true],[null,'insertParagraph',true],[' ','insertText',false],[null,'insertLineBreak',false]]){
    const h=mount(t);h.input(h.words[0].en+' ');
    assert(h.doc.querySelector('[data-action=next]'),'the submit space must not also advance');
    assert.equal(h.progress(),'0');assert.equal(h.points(),'1000');
    h.input(data,type,{cancelable});
    assert.equal(h.progress(),'1',type+' advances after a correct answer');
    assert.equal(h.editor.value,'');assert.equal(h.points(),'1000');
    assert.equal(h.doc.activeElement,h.editor);
    assert.equal(h.doc.querySelector('.feedback').textContent,'');
  }
});

test('completed answers ignore ordinary edits, IME composition and repeated confirmation keys',t=>{
  const h=mount(t);h.fill(h.words[0].en);h.key('Enter');
  const answer=h.editor.value;
  h.input('x');assert.equal(h.editor.value,answer);
  h.input('x','insertText',{cancelable:false});assert.equal(h.editor.value,answer);
  h.key('Enter',{repeat:true});h.key(' ',{isComposing:true});h.key('Enter',{keyCode:229});
  h.editor.dispatchEvent(new h.w.CompositionEvent('compositionstart',{bubbles:true}));
  h.input(' ','insertText',{isComposing:true});h.key('Enter');
  h.editor.dispatchEvent(new h.w.CompositionEvent('compositionend',{bubbles:true}));
  assert.equal(h.progress(),'0');assert.equal(h.points(),'1000');assert.equal(h.editor.value,answer);
  h.key('Enter');assert.equal(h.progress(),'1');
});

test('ordinary sentence spaces keep typing; final confirmation preserves score and completion',t=>{
  const h=mount(t);
  for(const word of h.words){h.fill(word.en);h.key('Enter');h.input(' ');}
  assert.equal(h.doc.querySelector('.exercise').dataset.phase,'sentence');
  const points=h.points();h.input(h.words[0].en+' ');
  assert.equal(h.doc.querySelector('[data-action=next]'),null);assert.equal(h.points(),points);
  h.fill(h.sentence.en);h.key('Enter');
  assert.equal(h.points(),String((h.words.length+1)*1000));
  h.input(null,'insertLineBreak');
  assert.equal(h.doc.querySelector('.exercise').dataset.phase,'preview');
  assert.equal(h.progress(),'0');
  const saved=JSON.parse(h.w.localStorage.getItem(h.w.EnglishSentenceProgress.key('english-8a-02')));
  assert.equal(h.w.EnglishSentenceProgress.summary([h.sentence],saved).completed,1);
});

test('desktop keeps next-button focus, keyboard activation and redo scoring',t=>{
  const h=mount(t,false);h.fill(h.words[0].en);h.key('Enter');
  assert.equal(h.doc.activeElement,h.doc.querySelector('[data-action=next]'));
  assert.equal(h.editor.readOnly,true);
  h.doc.querySelector('[data-action=redo]').click();h.fill(h.words[0].en);h.key('Enter');
  assert.equal(h.points(),'1000');h.doc.querySelector('[data-action=next]').click();
  assert.equal(h.progress(),'1');assert.equal(h.doc.activeElement,h.editor);
  h.fill(h.words[1].en);h.key('Enter');h.key(' ');
  assert.equal(h.progress(),'2');assert.equal(h.points(),'2000');
});
