/* Demonstrations never read or write practice records. All example text is rendered as text. */
(()=>{
 'use strict';
 function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
 function marked(text){const p=node('p','pd-english');p.lang='en';for(const part of text.split(/(\[[^\]]+\])/g))p.append(part.startsWith('[')?node('mark','',part.slice(1,-1)):document.createTextNode(part));return p;}
 function button(text,action){const b=node('button','',text);b.type='button';b.addEventListener('click',action);return b;}
 function mount(stage,data){
  let visual=null;
  const root=node('section','point-demo');root.dataset.demo=data.type;root.setAttribute('aria-label',data.type==='evidence'?'情境与证据':'词句变化演示');
  const head=node('div','pd-heading'),label=node('span','pd-label',data.type==='evidence'?'情境与证据':'词句变化');head.append(label);root.append(head);
  if(data.type==='sentence'){
   const before=node('div','pd-sentence pd-before'),after=node('div','pd-sentence pd-after'),note=node('p','pd-note',data.note);
   before.append(node('span','pd-caption','观察句'),marked(data.before),node('p','pd-translation',data.beforeZh));
   after.append(node('span','pd-caption','对照句'),marked(data.after),node('p','pd-translation',data.afterZh));
   const progress=node('span','pd-progress'),controls=node('div','pd-controls');let step=0;
   const advance=button('看变化',()=>{step++;render();}),back=button('回到原句',()=>{step=0;render();});
   advance.dataset.demoAction='advance';back.dataset.demoAction='reset';progress.setAttribute('role','status');
   function render(){after.hidden=step<1;note.hidden=step<2;back.hidden=step===0;advance.hidden=step===2;advance.textContent=step===0?'看变化':'看用法';progress.textContent=['先读原句','比较标出的词句','联系句意理解变化'][step];}
   controls.append(advance,back,progress);root.append(before,after,note,controls);render();
  }else if(data.type==='evidence'){
   root.append(node('h3','pd-prompt',data.prompt));
   if(data.visual==='patient-listening')visual=window.GrowingPatientScene.mount(root);
   const passage=node('div','pd-passage'),feedback=node('p','pd-note'),conclusion=node('p','pd-conclusion',data.conclusion),controls=node('div','pd-controls'),buttons=[];
   feedback.setAttribute('role','status');feedback.hidden=true;conclusion.hidden=true;
   data.lines.forEach((line,i)=>{
    const b=button('',()=>{buttons.forEach(el=>el.setAttribute('aria-pressed',String(el===b)));feedback.hidden=false;feedback.textContent=line.reason;b.classList.add(line.relevant?'is-evidence':'is-context');visual?.observe(i);});
    b.className='pd-line';b.dataset.evidence=String(i);b.setAttribute('aria-pressed','false');
    const number=node('span','pd-line-number',String(i+1).padStart(2,'0')),body=node('span','pd-line-body'),en=node('span','pd-english',line.text);en.lang='en';
    number.setAttribute('aria-hidden','true');body.append(en,node('span','pd-translation',line.translation));b.append(number,body);buttons.push(b);passage.append(b);
   });
   const reveal=button('看判断依据',()=>{buttons.forEach((b,i)=>{b.classList.toggle('is-evidence',data.lines[i].relevant);b.classList.remove('is-context');b.setAttribute('aria-pressed','false');});conclusion.hidden=false;reveal.hidden=true;feedback.hidden=true;visual?.show(2);});
   const reset=button('重新观察',()=>{buttons.forEach(b=>{b.classList.remove('is-evidence','is-context');b.setAttribute('aria-pressed','false');});feedback.hidden=true;conclusion.hidden=true;reveal.hidden=false;visual?.show(0);});
   reveal.dataset.demoAction='reveal';reset.dataset.demoAction='reset';controls.append(reveal,reset);root.append(passage,feedback,conclusion,controls);
  }else throw Error('当前演示需要动作播放器');
  stage.replaceChildren(root);
  return {pause:()=>visual?.pause(),dispose:()=>visual?.dispose()};
 }
 window.GrowingEnglishPointDemoView={mount};
})();
