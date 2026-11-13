const params=new URLSearchParams(location.search), compact=params.get('compact')==='1';
const shared=params.get('character')==='shared'&&parent!==window;
const $=selector=>window.GrowingStudentDuckControls?.node(selector)||document.querySelector(selector);
const parentOrigin=(()=>{try{return new URL(document.referrer).origin;}catch{return location.origin;}})();
let action='idle',mouthSource=()=>0,character,active=true;
const allowed=new Set(['idle','listen','think','speak','greet','celebrate','walk']);
const send=data=>{if(parent!==window)parent.postMessage(data,parentOrigin);};
function ready(){window.dispatchEvent(new Event('duck:ready'));document.body.dataset.ready='true';if($('#loading'))$('#loading').hidden=true;}

if(shared){
  document.body.classList.add('shared-character-mode');
  window.duckPreview={setLiveState(value){if(allowed.has(value)){action=value;send({type:'girl:state',action,mouth:0});}},setMouthSource(fn){mouthSource=fn;},getState:()=>({character:'girl',shared:true,action,mouth:action==='speak'?Math.max(0,Math.min(1,Number(mouthSource())||0)):0})};
  const startTimer=()=>setInterval(()=>{if(action==='speak'&&!document.hidden)send({type:'girl:state',action,mouth:Math.max(0,Math.min(1,Number(mouthSource())||0))});},50);
  let timer=startTimer();
  window.addEventListener('pagehide',()=>{clearInterval(timer);send({type:'girl:state',action:'idle',mouth:0});});
  window.addEventListener('pageshow',event=>{if(event.persisted)timer=startTimer();});
  ready();
}else{
  window.duckPreview={setLiveState(value){if(allowed.has(value)){action=value;character?.setLiveState(value);}},setMouthSource(fn){mouthSource=fn;character?.setMouthSource(fn);},getState:()=>character?.getState()||{character:'girl',ready:false}};
  window.addEventListener('message',event=>{
    if(!compact||event.source!==parent||event.origin!==parentOrigin)return;
    if(event.data?.type==='girl:state'&&allowed.has(event.data.action)){
      window.duckPreview.setLiveState(event.data.action);
      const value=Number(event.data.mouth),received=performance.now();window.duckPreview.setMouthSource(()=>performance.now()-received<350&&Number.isFinite(value)?Math.max(0,Math.min(1,value)):0);
    }
    if(event.data?.type==='girl:active'){active=event.data.value===true;character?.setActive(active);}
  });
  try{
    const {createGirl}=await import('./girl-renderer.js?v=20261113-girl-1');
    character=await createGirl(document.getElementById('viewport'),{compact});
    character.setLiveState(action);character.setMouthSource(mouthSource);character.setActive(active);
    window.duckPreview=character;
    const deadline=performance.now()+10000;
    while(character.getState().drawCalls===0&&performance.now()<deadline)await new Promise(requestAnimationFrame);
    if(character.getState().drawCalls===0)throw Error('Character produced no visible geometry');
    ready();send({type:'girl:ready'});
    if(!compact){
      for(const element of (window.GrowingStudentDuckControls?.nodes('[data-action]')||document.querySelectorAll('[data-action]')))element.addEventListener('click',()=>{
        const value=element.dataset.action;character.setLiveState(value);
        character.setMouthSource(value==='speak'?()=>Math.abs(Math.sin(performance.now()/170))*.8:mouthSource);
        if($('#state-name'))$('#state-name').textContent=element.textContent;
      });
      $('#reset')?.addEventListener('click',()=>character.reset());
      $('#rotate')?.addEventListener('click',()=>{character.controls.autoRotate=!character.controls.autoRotate;$('#rotate').setAttribute('aria-pressed',String(character.controls.autoRotate));});
      $('#export')?.addEventListener('click',()=>{const link=document.createElement('a');link.href=new URL('./characters/girl/girl1_face.glb',import.meta.url).href;link.download='girl1_face.glb';link.click();});
    }
    window.addEventListener('pagehide',event=>{if(event.persisted)character.setActive(false);else character.dispose();});
    window.addEventListener('pageshow',event=>{if(event.persisted)character.setActive(active);});
    character.renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();character.setActive(false);send({type:'girl:error'});});
    character.renderer.domElement.addEventListener('webglcontextrestored',()=>{if(compact)location.reload();});
  }catch(error){
    if($('#loading')){$('#loading').textContent='3D 暂时不可用，请刷新重试。';$('#loading').hidden=false;}
    document.body.dataset.ready='fallback';send({type:'girl:error'});
    console.warn('Girl model unavailable:',error.message);
  }
}
