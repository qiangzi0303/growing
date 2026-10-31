// Browser WebRTC media goes to Qwen; only SDP goes through our local credential proxy.
export class RealtimeConnection {
  constructor({instructions,onEvent=()=>{},onState=()=>{},onError=()=>{}}){Object.assign(this,{instructions,onEvent,onState,onError});this.generation=0;this.ready=false;this.cancelled=new Set();this.sources=[];}
  async start(){
    this.stop();const generation=this.generation;this.connecting=true;this.events=[];this.peakLevel=0;this.abort=new AbortController();
    const alive=()=>generation===this.generation;
    try{
      const api=window.GrowingRealtime;
      const config=api?await api.connectionInfo({signal:this.abort.signal}):await (await fetch('./api/realtime/config',{signal:this.abort.signal})).json();
      if(!config.configured)throw Error('请在连接设置中填写 Qwen 实时语音密钥。');
      if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection)throw Error('当前系统 WebView 或浏览器不支持实时语音，请更新后重试。');
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      if(!alive()){stream.getTracks().forEach(t=>t.stop());return;}
      this.stream=stream;const pc=this.pc=new RTCPeerConnection({iceServers:[]});
      const context=this.context=new AudioContext();await context.resume();if(!alive())return;
      const track=stream.getAudioTracks()[0];track.enabled=false;
      const sender=pc.addTrack(track,stream);await sender.replaceTrack(null);
      this.audio=new Audio();this.audio.autoplay=true;this.audio.muted=true;
      pc.ontrack=event=>{
        if(!alive())return;
        const remote=event.streams[0]||new MediaStream([event.track]);this.audio.srcObject=remote;
        const source=context.createMediaStreamSource(remote),analyser=context.createAnalyser();analyser.fftSize=512;source.connect(analyser);this.sources.push(source);this.analyser=analyser;
        this.audio.play().catch(()=>this.onError('声音播放被浏览器暂停，请结束后重新开启语音。'));
      };
      let resolveReady,rejectReady;
      const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
      ready.catch(()=>{});
      this.rejectReady=rejectReady;this.readyTimer=setTimeout(()=>rejectReady(Error('实时会话配置超时，请检查模型权限及网络。')),40000);
      const bind=channel=>{
        channel.onmessage=async message=>{
          if(!alive())return;
          let event;try{event=JSON.parse(message.data);}catch{return;}
          this.events.push(event.type||event.code||'unknown');if(this.events.length>30)this.events.shift();
          if(event.type==='session.created'){
            this.channel=channel;
            this.send({type:'session.update',session:{modalities:['text','audio'],voice:config.voice||'Tina',instructions:this.instructions(),input_audio_transcription:{model:'qwen3-asr-flash-realtime'},turn_detection:{type:'semantic_vad',threshold:.5,prefix_padding_ms:400,silence_duration_ms:800}}});
          }
          if(event.type==='session.updated'&&!this.ready){
            this.ready=true;this.connecting=false;clearTimeout(this.readyTimer);await sender.replaceTrack(track);if(!alive())return;track.enabled=true;resolveReady();this.onState('listen');
          }
          if(event.type==='error'||(!event.type&&event.code)){
            const code=event.error?.code||event.code||'';
            const reason=/Unpurchased|AccessDenied/.test(code)?'当前业务空间未开通 Qwen3.8 Omni Realtime，请在百炼开通后重试。':'实时服务返回错误（'+String(code).slice(0,80)+'）。';
            if(!this.ready){rejectReady(Error(reason));return;}
            this.onError(reason);this.interrupt();return;
          }
          if(event.type==='input_audio_buffer.speech_started'){this.interrupt();this.onState('listen');}
          if(event.type==='input_audio_buffer.speech_stopped')this.onState('think');
          if(event.type==='response.created'){
            this.responseId=event.response?.id;this.responseItem=null;this.busy=true;this.done=false;this.heardAudio=false;this.lastSound=performance.now();this.audio.muted=false;this.onState('think');
          }
          const id=event.response_id||event.response?.id;
          if(id&&this.cancelled.has(id))return;
          if(event.type==='response.output_item.added')this.responseItem=event.item?.id;
          if(event.type==='response.done'){this.busy=false;this.done=true;this.doneAt=performance.now();}
          this.onEvent(event);
        };
      };
      this.channel=pc.createDataChannel('oai-events');bind(this.channel);pc.ondatachannel=e=>bind(e.channel);
      pc.onconnectionstatechange=()=>{if(alive()&&['failed','closed'].includes(pc.connectionState)){rejectReady(Error('实时语音连接已断开。'));if(this.ready){this.stop();this.onError('实时语音连接已断开，请重新开启。');}}};
      await pc.setLocalDescription(await pc.createOffer());
      if(pc.iceGatheringState!=='complete')await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>{pc.removeEventListener('icegatheringstatechange',check);reject(Error('网络候选收集超时。'));},12000);
        const check=()=>{if(pc.iceGatheringState==='complete'){clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',check);resolve();}};pc.addEventListener('icegatheringstatechange',check);check();
      });
      if(!alive())return;
      // Attach rejection handler before the signalling request can fail.
      ready.catch(()=>{});
      let payload;
      if(api)payload=await api.connect(pc.localDescription.sdp,{signal:this.abort.signal});
      else{
        const answer=await fetch('./api/realtime/connect',{method:'POST',signal:this.abort.signal,headers:{'Content-Type':'application/json','X-Duck-Client':'1'},body:JSON.stringify({sdp:pc.localDescription.sdp})});
        payload=await answer.json();if(!answer.ok)throw Error(payload.error||'实时连接失败。');
      }
      if(!alive())return;
      await pc.setRemoteDescription({type:'answer',sdp:payload.sdp.trim().replace(/\r?\n/g,'\r\n')+'\r\n'});
      this.watch(generation);await ready;
    }catch(error){if(alive()){
      this.stop();
      if(error.name==='NotAllowedError'||error.name==='SecurityError')throw Error('麦克风未获授权。请在系统设置中允许本应用使用麦克风，再重新开启语音。');
      if(error.name==='NotFoundError')throw Error('未找到可用麦克风，请检查设备。');
      if(error.name==='NotReadableError')throw Error('麦克风暂不可用，可能正被其他应用占用。');
      if(error.name!=='AbortError')throw error;
    }}
  }
  send(event){if(this.channel?.readyState!=='open')return false;this.channel.send(JSON.stringify({...event,event_id:'duck_'+Date.now()+'_'+Math.random().toString(36).slice(2)}));return true;}
  update(){if(this.ready)this.send({type:'session.update',session:{instructions:this.instructions()}});}
  request(text){
    if(!this.ready)throw Error('请先开启实时语音。');
    this.interrupt();this.send({type:'conversation.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text}]}});this.send({type:'response.create'});this.onState('think');
  }
  interrupt(){
    const active=this.busy;
    if(this.responseId){this.cancelled.add(this.responseId);if(this.cancelled.size>100)this.cancelled.delete(this.cancelled.values().next().value);}
    if(active)this.send({type:'response.cancel'});
    if(this.audio)this.audio.muted=true;
    this.busy=false;this.done=false;this.level=0;this.sounding=false;this.onState(this.ready?'listen':'idle');
  }
  watch(generation){
    if(generation!==this.generation)return;
    let rms=0;if(this.analyser){const data=new Float32Array(this.analyser.fftSize);this.analyser.getFloatTimeDomainData(data);rms=Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length);}
    this.level=this.audio&&!this.audio.muted&&!this.audio.paused?Math.min(1,rms*6):0;
    this.peakLevel=Math.max(this.peakLevel||0,this.level);
    const now=performance.now();
    if(this.level>.025){this.lastSound=now;this.heardAudio=true;if(!this.sounding){this.sounding=true;this.onState('speak');}}
    else if(this.sounding&&now-this.lastSound>300){this.sounding=false;this.onState(this.busy?'think':'listen');}
    // response.done means generation ended; wait for the received audio tail too.
    if(this.done&&now-this.lastSound>650&&now-this.doneAt>(this.heardAudio?650:1800)){this.done=false;this.onEvent({type:'duck.playback.finished',response_id:this.responseId});}
    this.raf=requestAnimationFrame(()=>this.watch(generation));
  }
  mouth(){return this.level||0;}
  stop(){
    ++this.generation;this.abort?.abort();clearTimeout(this.readyTimer);this.rejectReady?.(new DOMException('Aborted','AbortError'));this.rejectReady=null;cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;
    if(this.pc){this.pc.onconnectionstatechange=null;this.pc.close();this.pc=null;}
    this.channel=null;if(this.audio){this.audio.pause();this.audio.srcObject=null;this.audio=null;}
    this.sources.forEach(s=>s.disconnect());this.sources=[];this.context?.close().catch(()=>{});this.context=null;this.analyser=null;
    this.ready=false;this.connecting=false;this.busy=false;this.done=false;this.sounding=false;this.level=0;
  }
}
