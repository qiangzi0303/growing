const abortError=()=>new DOMException('Aborted','AbortError');
export const usesCloudTTS=config=>config.ttsEngine==='cloud'||(config.ttsEngine!=='browser'&&config.engine==='cloud');
export function preferredVoice(voices,config){
  const explicit=voices.find(v=>v.voiceURI===config.browserVoice);if(explicit)return explicit;
  const language=(config.language||'zh-CN').toLowerCase();
  return voices.filter(v=>v.lang.toLowerCase().split('-')[0]===language.split('-')[0]).sort((a,b)=>{
    const score=v=>(v.lang.toLowerCase()===language?8:0)+(/natural|neural|自然|神经/i.test(v.name)?20:0)+(v.default?1:0);
    return score(b)-score(a);
  })[0];
}
function delivery(config,text){
  const style={warm:{rate:.96,pitch:1.04},calm:{rate:.90,pitch:1},bright:{rate:1.02,pitch:1.08},neutral:{rate:1,pitch:1}}[config.speakingStyle]||{rate:.96,pitch:1.04};
  const chosen=Number(config.speechRate)||1;
  return {rate:Math.max(.7,Math.min(1.3,chosen*style.rate)),pitch:style.pitch+(config.speakingStyle!=='neutral'&&/[？?]$/.test(text.trim())?.02:0)};
}
async function checked(response){
  if(response.ok)return response;
  let message='语音请求失败（HTTP '+response.status+'）';
  try{const data=await response.json();if(typeof data.error==='string')message=data.error;}catch{}
  throw Error(message);
}

export class Speaker {
  constructor(getConfig,onPlaying){this.config=getConfig;this.onPlaying=onPlaying;this.playing=false;this.cancelCurrent=null;this.audio=null;this.context=null;this.analyser=null;}
  async unlock(){
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(AudioContext){this.context ||= new AudioContext();if(this.context.state==='suspended')await this.context.resume();}
  }
  stop(){this.cancelCurrent?.();this.cancelCurrent=null;window.speechSynthesis?.cancel();if(this.audio){this.audio.pause();this.audio=null;}this.playing=false;this.onPlaying(false);}
  mouth(){
    if(!this.playing)return 0;
    if(this.audio&&this.analyser){const samples=new Uint8Array(this.analyser.fftSize);this.analyser.getByteTimeDomainData(samples);let sum=0;for(const v of samples)sum+=((v-128)/128)**2;return Math.min(1,Math.sqrt(sum/samples.length)*5);}
    // Native speech exposes playback/boundary events, not PCM. Never move a closed/paused mouth.
    return window.speechSynthesis?.speaking&&!window.speechSynthesis?.paused ? .12+Math.abs(Math.sin(performance.now()*.014))*.58 : 0;
  }
  async speak(text,signal){
    if(signal.aborted)throw abortError();
    const config=this.config();
    const prosody=delivery(config,text);
    if(usesCloudTTS(config)){
      const response=await checked(await fetch('./api/tts',{method:'POST',signal,headers:{'Content-Type':'application/json','X-Duck-Client':'1'},body:JSON.stringify({base:config.ttsBase,key:config.ttsKey,model:config.ttsModel,voice:config.ttsVoice,text,speed:prosody.rate,instructions:config.ttsInstructions||''})}));
      const blob=await response.blob();if(signal.aborted)throw abortError();
      return this.playAudio(blob,signal);
    }
    if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)throw Error('此浏览器不支持朗读，可在设置中切换语音接口。');
    return new Promise((resolve,reject)=>{
      const utterance=new SpeechSynthesisUtterance(text);utterance.lang=config.language;utterance.rate=prosody.rate;utterance.pitch=prosody.pitch;
      const voice=preferredVoice(window.speechSynthesis.getVoices(),config);if(voice)utterance.voice=voice;
      let settled=false;
      const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);signal.removeEventListener('abort',cancel);this.cancelCurrent=null;this.playing=false;this.onPlaying(false);error?reject(error):resolve();};
      const cancel=()=>{window.speechSynthesis.cancel();finish(abortError());};
      const timer=setTimeout(()=>{window.speechSynthesis.cancel();finish(Error('设备朗读未完成，请检查系统音色，或关闭朗读继续文字对话。'));},60000);
      utterance.onstart=()=>{if(signal.aborted)return cancel();this.playing=true;this.onPlaying(true);};
      utterance.onend=()=>finish();utterance.onerror=e=>finish(signal.aborted?abortError():Error('设备朗读失败：'+e.error+'。可以关闭朗读继续聊天。'));
      this.cancelCurrent=cancel;signal.addEventListener('abort',cancel,{once:true});window.speechSynthesis.speak(utterance);
    });
  }
  async playAudio(blob,signal){
    await this.unlock();if(signal.aborted)throw abortError();
    const url=URL.createObjectURL(blob),audio=new Audio(url);this.audio=audio;
    let source;
    if(this.context){source=this.context.createMediaElementSource(audio);this.analyser=this.context.createAnalyser();this.analyser.fftSize=256;source.connect(this.analyser);this.analyser.connect(this.context.destination);}
    return new Promise((resolve,reject)=>{
      let settled=false;
      const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);signal.removeEventListener('abort',cancel);audio.onpause=null;audio.onplaying=null;audio.onended=null;audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();source?.disconnect();this.analyser?.disconnect();this.analyser=null;this.audio=null;URL.revokeObjectURL(url);this.cancelCurrent=null;this.playing=false;this.onPlaying(false);error?reject(error):resolve();};
      const cancel=()=>finish(abortError());const timer=setTimeout(()=>finish(Error('语音播放超时。')),60000);
      this.cancelCurrent=cancel;signal.addEventListener('abort',cancel,{once:true});
      audio.onplaying=()=>{if(signal.aborted)return cancel();this.playing=true;this.onPlaying(true);};
      audio.onpause=()=>{this.playing=false;this.onPlaying(false);};audio.onended=()=>finish();audio.onerror=()=>finish(Error('音频无法播放，请检查 TTS 输出格式。'));
      audio.play().catch(()=>finish(Error('浏览器阻止了播放，请点击页面后重试。')));
    });
  }
}

export class Microphone {
  constructor({getConfig,onTranscript,onInterim,onError,onBarge,isSpeaking}){Object.assign(this,{getConfig,onTranscript,onInterim,onError,onBarge,isSpeaking});this.active=false;this.paused=false;this.finalText='';this.timer=null;this.recognition=null;this.recorder=null;this.generation=0;}
  async start(){
    const generation=++this.generation;
    const config=this.getConfig();const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(config.engine==='browser'&&!Recognition)throw Error('此浏览器不支持语音识别。请使用桌面 Chrome/Edge，或在设置中选择语音接口；也可以打字。');
    if(!navigator.mediaDevices?.getUserMedia)throw Error('麦克风不可用，请从本机预览或 HTTPS 页面打开。');
    let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});}catch{throw Error('未获得麦克风权限，请允许后重试；也可以直接打字。');}
    if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    let context,source,analyser;
    try{context=new AudioContext();await context.resume();source=context.createMediaStreamSource(stream);analyser=context.createAnalyser();analyser.fftSize=512;source.connect(analyser);}
    catch{stream.getTracks().forEach(t=>t.stop());context?.close().catch(()=>{});if(generation===this.generation)this.stop();throw Error('无法初始化麦克风音频，请重试。');}
    if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());source.disconnect();context.close().catch(()=>{});return;}
    this.stream=stream;this.context=context;this.source=source;this.analyser=analyser;this.active=true;this.paused=false;this.finalText='';
    if(config.engine==='browser'){
      this.recognition=new Recognition();this.recognition.lang=config.language;this.recognition.continuous=true;this.recognition.interimResults=true;
      this.recognition.onresult=event=>{
        if(!this.active||this.paused)return;
        let interim='';for(let i=event.resultIndex;i<event.results.length;i++){const text=event.results[i][0].transcript;if(event.results[i].isFinal)this.finalText+=text;else interim+=text;}
        this.onInterim(this.finalText+interim);clearTimeout(this.timer);
        if(this.finalText)this.timer=setTimeout(()=>this.flush(),Number(this.getConfig().silence));
      };
      this.recognition.onerror=event=>{
        if(!this.active||this.paused||event.error==='aborted'||event.error==='no-speech')return;
        const reason={'not-allowed':'麦克风权限被拒绝。','service-not-allowed':'浏览器不允许使用识别服务。','audio-capture':'未找到可用麦克风。','network':'设备识别服务无法连接，可切换语音接口或打字。'};
        this.stop();this.onError(reason[event.error]||'语音识别失败，请重试。');
      };
      this.recognition.onend=()=>{clearTimeout(this.restartTimer);if(this.active&&!this.paused)this.restartTimer=setTimeout(()=>this.startRecognition(),250);};
      this.startRecognition();
    }else this.startRecording();
    this.watch();
  }
  startRecognition(){if(!this.active||this.paused)return;try{this.recognition?.start();}catch{} }
  flush(){
    clearTimeout(this.timer);const text=this.finalText.trim();this.finalText='';this.onInterim('');if(text)this.onTranscript(text);
  }
  pause(){this.paused=true;clearTimeout(this.timer);clearTimeout(this.restartTimer);this.finalText='';try{this.recognition?.abort();}catch{}this.stopRecording(false);this.onInterim('');}
  resume(){if(!this.active)return;this.paused=false;this.voiceSince=0;if(this.getConfig().engine==='browser')this.startRecognition();else this.startRecording();}
  startRecording(){
    if(!this.active||this.paused||this.transcribing||this.recorder?.state==='recording')return;
    const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(v=>window.MediaRecorder?.isTypeSupported(v));
    if(!window.MediaRecorder||!mime){this.stop();this.onError('浏览器不支持录音，请使用其他浏览器或设备语音。');return;}
    const generation=this.generation,recorder=new MediaRecorder(this.stream,{mimeType:mime});this.recorder=recorder;let chunks=[];
    this.recordStarted=performance.now();this.hasVoice=false;this.lastVoice=this.recordStarted;this.keepRecording=false;
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{if(this.recorder===recorder)this.recorder=null;const blob=new Blob(chunks,{type:mime});chunks=[];if(generation!==this.generation)return;if(recorder.keepAudio&&this.active&&!this.paused){this.transcribe(blob);}else if(this.active&&!this.paused)this.startRecording();};
    recorder.start(250);
  }
  stopRecording(keep){if(this.recorder?.state==='recording'){this.recorder.keepAudio=keep;this.recorder.stop();}}
  async transcribe(blob){
    const generation=this.generation,config=this.getConfig();this.transcribing=true;this.asrController=new AbortController();
    const timer=setTimeout(()=>this.asrController?.abort(),45000);this.onInterim('正在识别这段语音…');
    try{
      const form=new FormData();form.append('config',JSON.stringify({base:config.asrBase,key:config.asrKey,model:config.asrModel,language:config.language}));form.append('file',blob,'recording.webm');
      const response=await checked(await fetch('./api/asr',{method:'POST',headers:{'X-Duck-Client':'1'},body:form,signal:this.asrController.signal}));
      const {text}=await response.json();if(generation===this.generation&&this.active){this.onInterim('');if(text?.trim())this.onTranscript(text.trim());}
    }catch(error){if(generation===this.generation&&this.active){this.onInterim('');this.onError(error.name==='AbortError'?'语音识别超时，请重试。':error.message);}}
    finally{clearTimeout(timer);this.transcribing=false;if(generation===this.generation&&this.active&&!this.paused)this.startRecording();}
  }
  watch(){
    if(!this.active)return;
    const samples=new Float32Array(this.analyser.fftSize);this.analyser.getFloatTimeDomainData(samples);let sum=0;for(const s of samples)sum+=s*s;const rms=Math.sqrt(sum/samples.length),now=performance.now();
    this.noise ??= .003;const loud=rms>Math.max(.022,this.noise*3.2);
    if(!loud)this.noise=this.noise*.98+Math.min(rms,.012)*.02;
    if(loud){this.voiceSince ||= now;this.lastVoice=now;this.hasVoice=true;}else this.voiceSince=0;
    if(this.isSpeaking()&&this.voiceSince&&now-this.voiceSince>220&&now-(this.lastBarge||0)>1300){this.lastBarge=now;this.voiceSince=0;this.onBarge();}
    if(this.recorder?.state==='recording'&&!this.paused){
      if(this.hasVoice&&now-this.lastVoice>Number(this.getConfig().silence))this.stopRecording(true);
      else if(now-this.recordStarted>30000)this.stopRecording(this.hasVoice);
    }
    this.raf=requestAnimationFrame(()=>this.watch());
  }
  stop(){
    ++this.generation;this.active=false;this.paused=false;this.transcribing=false;clearTimeout(this.timer);clearTimeout(this.restartTimer);cancelAnimationFrame(this.raf);this.asrController?.abort();this.stopRecording(false);
    try{this.recognition?.abort();}catch{}this.recognition=null;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.source?.disconnect();this.context?.close().catch(()=>{});this.context=null;this.finalText='';this.onInterim('');
  }
}
