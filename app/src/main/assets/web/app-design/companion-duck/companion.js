import {streamReply} from './ai-client.js';
import {Speaker,Microphone,usesCloudTTS,preferredVoice} from './voice-engine.js';

const $=s=>document.querySelector(s);
const defaults={engine:'browser',ttsEngine:'auto',speakingStyle:'warm',speechRate:'1',ttsInstructions:'',language:'zh-CN',browserVoice:'',silence:'2500',asrBase:'',asrModel:'',ttsBase:'',ttsModel:'',ttsVoice:''};
let config={...defaults,asrKey:'',ttsKey:''};
try{const stored=JSON.parse(localStorage.getItem('duck-voice-prefs-v1')||'{}');for(const key of Object.keys(defaults))if(typeof stored[key]==='string')config[key]=stored[key];}catch{}
// Never silently reopen the microphone or persist conversations/provider speech keys.
let history=[],job=null,serial=0,voiceGeneration=0,wantsVoice=false,startingVoice=false,state='idle',celebrationTimer;
const labels={idle:'安静陪伴',listen:'认真倾听',think:'正在想一想',speak:'小鸭正在说',celebrate:'完成这一段'};
const messages=$('#messages'),input=$('#chat-input'),notice=$('#voice-notice');
function showNotice(text){notice.textContent=text||'';}
function setState(value,text=''){
  state=value;$('#live-state').textContent=labels[value]||value;
  window.duckPreview?.setLiveState(value,text);
  $('#interrupt').disabled=!(job||speaker.playing||startingVoice||wantsVoice);
}
const speaker=new Speaker(()=>config,playing=>{
  if(playing){microphone.pause();setState('speak');}
  else {if(wantsVoice&&microphone.active)microphone.resume();if(job)setState('think');else setState(wantsVoice?'listen':'idle');}
});
const microphone=new Microphone({getConfig:()=>config,onTranscript:text=>send(text),onInterim:text=>{$('#interim').textContent=text;},onError:text=>{showNotice(text);if(!microphone.active){wantsVoice=false;updateVoiceButton();setState('idle');}},onBarge:()=>interrupt(true),isSpeaking:()=>speaker.playing});

function addMessage(role,text){const node=document.createElement('div');node.className='message '+role;node.textContent=text;messages.appendChild(node);messages.scrollTop=messages.scrollHeight;return node;}
function updateVoiceButton(){
  $('#voice-toggle').textContent=startingVoice?'正在开启…':wantsVoice?'结束语音':'开启语音';$('#voice-toggle').setAttribute('aria-pressed',String(wantsVoice));$('#voice-toggle').disabled=startingVoice;
  $('#voice-source').textContent=(usesCloudTTS(config)?'云端朗读':'设备朗读')+(wantsVoice?' · 麦克风已开启':' · 开启后才使用麦克风');
}
function finish(current){
  if(job!==current||!current.networkDone||current.pumping||current.queue.length)return;
  if(current.text.trim())history.push({role:'assistant',content:current.text.trim()});
  job=null;clearTimeout(current.timer);if(wantsVoice)microphone.resume();setState(wantsVoice?'listen':'idle');
}
function feed(current,full,final=false){
  if(job!==current)return;current.text=full;
  current.node.textContent=full||'正在想…';messages.scrollTop=messages.scrollHeight;
  if(!$('#read-aloud').checked){current.consumed=full.length;return;}
  let remaining=full.slice(current.consumed),match;
  while((match=remaining.match(/^([\s\S]*?[。！？!?；;\n]|[\s\S]*?\.\s)/))){
    // Keep brief lead-ins with the next sentence so the voice retains context.
    if(!final&&match[0].trim().length<24&&remaining.length===match[0].length)break;
    let chunk=match[0];
    while(chunk.trim().length<24){const next=remaining.slice(chunk.length).match(/^([\s\S]*?[。！？!?；;\n]|[\s\S]*?\.\s)/);if(!next)break;chunk+=next[0];}
    current.consumed+=chunk.length;if(chunk.trim())current.queue.push(chunk.trim());remaining=full.slice(current.consumed);
  }
  if(final&&remaining.trim()){current.queue.push(remaining.trim());current.consumed=full.length;}
  pump(current);
}
async function pump(current){
  if(job!==current||current.pumping||!current.queue.length||current.voice.signal.aborted)return;
  current.pumping=true;
  try{while(job===current&&current.queue.length&&!current.voice.signal.aborted){const text=current.queue.shift();await speaker.speak(text.replace(/[*#`]/g,''),current.voice.signal);}}
  catch(error){if(job===current&&error.name!=='AbortError'){showNotice(error.message+' 回答文字已保留。');current.queue=[];}}
  finally{current.pumping=false;if(job===current){if(current.queue.length&&!current.voice.signal.aborted)pump(current);else finish(current);}}
}
function interrupt(resume=true){
  clearTimeout(celebrationTimer);const old=job;job=null;++serial;
  if(old){clearTimeout(old.timer);old.abort.abort();old.voice.abort();old.queue=[];old.node.classList.add('interrupted');if(old.text.trim())history.push({role:'assistant',content:old.text.trim()+'（此处被学生打断）'});else old.node.textContent='回答已停止。';}
  speaker.stop();microphone.pause();if(resume&&wantsVoice)microphone.resume();
  setState(resume&&wantsVoice?'listen':'idle');
}
async function send(text){
  text=String(text||'').trim();if(!text)return;
  if(text.length>4000){showNotice('请把问题缩短到 4000 字以内。');return;}
  if(!window.GrowingCourseAI?.info().configured){showNotice('先在“连接设置”保存 AI 密钥，就可以开始聊天。');$('#settings-dialog').showModal();return;}
  interrupt(false);showNotice('');input.value='';speaker.unlock().catch(()=>{});
  const id=++serial;addMessage('user',text);history.push({role:'user',content:text});history=history.slice(-16);
  const current={id,abort:new AbortController(),voice:new AbortController(),queue:[],text:'',consumed:0,networkDone:false,pumping:false,node:addMessage('assistant','正在想…')};job=current;
  current.timer=setTimeout(()=>{if(job===current){current.timedOut=true;current.abort.abort();}},60000);
  setState('think');if(wantsVoice)microphone.resume();
  try{
    const full=await streamReply({history,topic:$('#topic').value,mode:$('#study-mode').value,signal:current.abort.signal,onText:text=>feed(current,text)});
    if(job!==current)return;feed(current,full,true);
  }catch(error){
    if(job!==current)return;
    if(error.name!=='AbortError'||current.timedOut){const message=current.timedOut?'AI连接超时，请重试。':error.message;showNotice(message);current.node.classList.add('error');if(!current.text)current.node.textContent=message;else current.node.classList.add('interrupted');}
    current.queue=[];current.voice.abort();speaker.stop();
  }finally{
    clearTimeout(current.timer);current.networkDone=true;if(job===current)finish(current);
  }
}
$('#chat-form').addEventListener('submit',event=>{event.preventDefault();send(input.value);});
input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();send(input.value);}});
$('#interrupt').addEventListener('click',()=>{if(startingVoice){++voiceGeneration;wantsVoice=false;microphone.stop();startingVoice=false;updateVoiceButton();}interrupt(true);});
$('#voice-toggle').addEventListener('click',async()=>{
  if(wantsVoice){++voiceGeneration;wantsVoice=false;microphone.stop();interrupt(false);updateVoiceButton();return;}
  if(!window.GrowingCourseAI?.info().configured){showNotice('请先配置 AI 连接，再开启语音。');$('#settings-dialog').showModal();return;}
  if((config.engine==='cloud'&&!config.asrKey)||(usesCloudTTS(config)&&!config.ttsKey)){showNotice('请先在连接设置中填写所选语音服务的密钥。');$('#settings-dialog').showModal();return;}
  const attempt=++voiceGeneration;startingVoice=true;wantsVoice=true;updateVoiceButton();setState('listen');showNotice('');
  try{await speaker.unlock();if(attempt!==voiceGeneration)return;await microphone.start();if(attempt===voiceGeneration&&!microphone.active)wantsVoice=false;}
  catch(error){if(attempt===voiceGeneration){wantsVoice=false;microphone.stop();showNotice(error.message);}}
  finally{if(attempt===voiceGeneration){startingVoice=false;updateVoiceButton();setState(wantsVoice?'listen':'idle');}}
});
$('#read-aloud').addEventListener('change',()=>{
  if(!$('#read-aloud').checked){if(job){job.queue=[];job.voice.abort();}speaker.stop();if(job)finish(job);}
  else if(job)job.voice=new AbortController();
});
$('#done-learning').addEventListener('click',()=>{
  interrupt(false);const text='这一段完成了，辛苦啦。等你准备好，我们再接着学。';addMessage('assistant',text);history.push({role:'user',content:'我报告：完成这一段学习。尚未进行独立复测。'},{role:'assistant',content:text});
  setState('celebrate',text);celebrationTimer=setTimeout(()=>{if(wantsVoice)microphone.resume();setState(wantsVoice?'listen':'idle');},2800);
});
$('#clear-chat').addEventListener('click',()=>{interrupt(true);history=[];messages.replaceChildren();addMessage('assistant','新的一段，我们从哪里开始？');showNotice('');});
$('#appearance').addEventListener('click',()=>{const panel=$('.panel');panel.hidden=!panel.hidden;if(!panel.hidden)interrupt(true);else setState(wantsVoice?'listen':'idle');});

const settings=$('#settings-dialog'),form=$('#voice-settings');
$('#ai-settings').innerHTML=window.GrowingCourseAI?.settingsMarkup()||'<p>AI设置暂时无法载入。</p>';
function updateSpeechFields(){const draft={engine:form.elements.engine.value,ttsEngine:form.elements.ttsEngine.value};$('#cloud-fields').hidden=draft.engine!=='cloud'&&!usesCloudTTS(draft);$('#asr-fields').hidden=draft.engine!=='cloud';$('#tts-fields').hidden=!usesCloudTTS(draft);}
function fillSettings(){for(const key of Object.keys(defaults))if(form.elements[key])form.elements[key].value=config[key];form.elements.asrKey.value='';form.elements.ttsKey.value='';updateSpeechFields();}
function voices(){
  const select=$('#browser-voices'),previous=select.value||config.browserVoice;select.replaceChildren(new Option('自动优选自然音色（同语言）',''));
  for(const voice of window.speechSynthesis?.getVoices()||[])select.add(new Option(voice.name+' · '+voice.lang,voice.voiceURI));select.value=previous;
}
voices();window.speechSynthesis?.addEventListener('voiceschanged',voices);
$('#open-settings').addEventListener('click',()=>{fillSettings();settings.showModal();});$('#close-settings').addEventListener('click',()=>settings.close());
form.elements.engine.addEventListener('change',updateSpeechFields);
form.elements.ttsEngine.addEventListener('change',updateSpeechFields);
let previewController=null;
function stopPreview(){previewController?.abort();previewController=null;$('#preview-voice').textContent='试听声音';}
settings.addEventListener('close',stopPreview);
$('#preview-voice').addEventListener('click',async()=>{
  if(previewController){stopPreview();return;}
  interrupt(false);
  const draft={...config};for(const key of Object.keys(defaults))draft[key]=form.elements[key].value.trim();draft.ttsKey=form.elements.ttsKey.value.trim()||config.ttsKey;
  if(usesCloudTTS(draft)&&(!draft.ttsBase||!draft.ttsModel||!draft.ttsVoice||!draft.ttsKey)){$('#settings-status').textContent='请先填写 TTS 地址、模型、音色和密钥，再试听。';return;}
  const controller=new AbortController();previewController=controller;$('#preview-voice').textContent='停止试听';
  const preview=new Speaker(()=>draft,playing=>{setState(playing?'speak':'idle');});
  window.duckPreview?.setMouthSource(()=>preview.mouth());
  const selected=preferredVoice(window.speechSynthesis?.getVoices()||[],draft);
  $('#settings-status').textContent=usesCloudTTS(draft)?'正在试听云端声音…':'试听音色：'+(selected?.name||'系统默认')+'。设备朗读的情感表现取决于系统音色。';
  try{await preview.speak(draft.language==='en-US'?"I'm here. Take your time. Shall we try the next step together?":'别着急，我在呢。我们先看这一步，好不好？对，就是这个思路！',controller.signal);}
  catch(error){if(error.name!=='AbortError')$('#settings-status').textContent=error.message;}
  finally{if(previewController===controller)stopPreview();connectDuck();if(wantsVoice)microphone.resume();}
});
form.addEventListener('submit',event=>{
  event.preventDefault();const next={...config};for(const key of Object.keys(defaults))next[key]=form.elements[key].value.trim();
  next.asrKey=form.elements.asrKey.value.trim()||config.asrKey;next.ttsKey=form.elements.ttsKey.value.trim()||config.ttsKey;
  try{
    const required=[...(next.engine==='cloud'?['asr']:[]),...(usesCloudTTS(next)?['tts']:[])];
    for(const kind of required){const url=new URL(next[kind+'Base']);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('接口根地址需使用 HTTPS，不要包含密钥或查询参数。');if(!next[kind+'Key']||!next[kind+'Model'])throw Error('请填写所选语音接口的模型和密钥。');}
    if(usesCloudTTS(next)&&!next.ttsVoice)throw Error('请填写 TTS 音色 ID。');
    const prefs={};for(const key of Object.keys(defaults))prefs[key]=next[key];localStorage.setItem('duck-voice-prefs-v1',JSON.stringify(prefs));
    stopPreview();++voiceGeneration;startingVoice=false;wantsVoice=false;microphone.stop();interrupt(false);config=next;fillSettings();updateVoiceButton();$('#settings-status').textContent='已保存。请重新开启语音；接口密钥只在当前页暂存。';
  }catch(error){$('#settings-status').textContent=error.message;}
});
settings.addEventListener('close',()=>{$('#connection-summary').textContent=window.GrowingCourseAI?.info().configured?'连接已就绪，随时可以和小鸭聊聊。':'先在连接设置中保存 AI 密钥，即可开始。';});
fillSettings();updateVoiceButton();
function connectDuck(){window.duckPreview?.setMouthSource(()=>speaker.mouth());setState(state);}
window.addEventListener('duck:ready',connectDuck);if(window.duckPreview)connectDuck();
// Course pages can supply explicit context; no inference of mastery from silence or completion clicks.
window.addEventListener('duck:learning-context',event=>{const context=event.detail;if(context&&typeof context.topic==='string')$('#topic').value=context.topic.slice(0,300);if(['learn','exam'].includes(context?.mode))$('#study-mode').value=context.mode;});
function release(){stopPreview();++voiceGeneration;wantsVoice=false;startingVoice=false;microphone.stop();interrupt(false);updateVoiceButton();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});window.addEventListener('pagehide',release);
window.duckCompanion={getState:()=>({state,voiceActive:wantsVoice,microphoneActive:microphone.active,playing:speaker.playing,busy:!!job,messages:history.length,engine:config.engine}),interrupt:()=>interrupt(true)};
