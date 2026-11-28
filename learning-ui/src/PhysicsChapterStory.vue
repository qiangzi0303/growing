<script setup>
import {computed,ref,onBeforeUnmount} from 'vue';
import {chapterStories,chapterDefaults} from './physics-chapter-stories.js';
import {chapterState,clamp} from './physics-chapter-model.js';
const props=defineProps({nodeId:{type:String,required:true}});
const story=chapterStories[props.nodeId],values=ref(chapterDefaults(props.nodeId)),progress=ref(0),playing=ref(false),expanded=ref(false);
const model=computed(()=>chapterState(props.nodeId,values.value,progress.value));
const stage=computed(()=>model.value.stage);
let frame=0,last=0,audio=null,oscillator=null,audioGain=null,audioTimer=0;
const sounding=ref(false),volume=ref(.5),sourceSoundEnabled=ref(true),soundError=ref('');
function stopSound(){clearTimeout(audioTimer);if(oscillator){oscillator.stop();oscillator.disconnect();oscillator=null;}if(audio){void audio.close();audio=null;}audioGain=null;sounding.value=false;}
function pause(){playing.value=false;cancelAnimationFrame(frame);last=0;stopSound();}
function tick(now){if(!playing.value)return;if(last)progress.value=clamp(progress.value+Math.min(.08,(now-last)/1000)/24);last=now;if(story.kind==='source'&&!model.value.active&&sounding.value)stopSound();if(progress.value>=1){pause();return;}frame=requestAnimationFrame(tick);}
function play(){if(playing.value){pause();return;}if(progress.value===1)progress.value=0;playing.value=true;last=0;if(story.kind==='source')startSourceSound();frame=requestAnimationFrame(tick);}
function seek(value){pause();stopSound();progress.value=clamp(Number(value));}
function change(key,event){pause();stopSound();values.value={...values.value,[key]:event.target.type==='range'?Number(event.target.value):event.target.value};}
function reset(){pause();stopSound();progress.value=0;values.value=chapterDefaults(props.nodeId);}
function visibility(){if(document.hidden){pause();stopSound();}}
function startSourceSound(){
 if(!sourceSoundEnabled.value||!playing.value||!model.value.active)return;
 stopSound();soundError.value='';
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio){soundError.value='当前浏览器不支持声音播放。';return;}
 try{
  const context=new Audio();audio=context;oscillator=context.createOscillator();audioGain=context.createGain();
  oscillator.type='sine';oscillator.frequency.value=440;
  audioGain.gain.setValueAtTime(0,context.currentTime);audioGain.gain.linearRampToValueAtTime(.07*volume.value,context.currentTime+.03);
  oscillator.connect(audioGain);audioGain.connect(context.destination);oscillator.start();sounding.value=true;
  void context.resume().catch(()=>{if(audio===context){stopSound();soundError.value='声音未能启动，请重新点击播放。';}});
 }catch{stopSound();soundError.value='声音未能启动，请重新点击播放。';}
}
function toggleSourceSound(){sourceSoundEnabled.value=!sourceSoundEnabled.value;if(sourceSoundEnabled.value)startSourceSound();else stopSound();}
function sourceVolume(){if(audioGain&&audio)audioGain.gain.setTargetAtTime(.07*volume.value,audio.currentTime,.02);}
function listen(){
 if(sounding.value){stopSound();return;}
 const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
 audio=new Audio();oscillator=audio.createOscillator();const gain=audio.createGain();oscillator.frequency.value=story.kind==='pitch'?Number(values.value.frequency):200;
 if(story.kind==='timbre'&&values.value.tone!=='pure'){const real=new Float32Array(4),imag=new Float32Array(4);imag[1]=1;imag[values.value.tone==='bright'?3:2]=.45;oscillator.setPeriodicWave(audio.createPeriodicWave(real,imag));}
 const level=(story.kind==='loudness'?.015*Number(values.value.amplitude)/Number(values.value.distance):.035)*volume.value;
 gain.gain.setValueAtTime(0,audio.currentTime);gain.gain.linearRampToValueAtTime(level,audio.currentTime+.03);gain.gain.setValueAtTime(level,audio.currentTime+.8);gain.gain.linearRampToValueAtTime(0,audio.currentTime+.95);
 oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();sounding.value=true;audioTimer=setTimeout(stopSound,1000);
}
document.addEventListener('visibilitychange',visibility);
window.addEventListener('pagehide',pause);
onBeforeUnmount(()=>{pause();stopSound();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pause);});
</script>

<template>
 <section class="chapter-story" :data-chapter-story="nodeId" :data-story-stage="stage" :aria-label="story.chapter+'分幕交互'">
  <header class="story-header"><p>{{story.chapter}} <span>／</span> 分幕观察</p><h3>{{story.title}}</h3><p class="story-question">{{story.question}}</p></header>
  <nav class="story-chapters" aria-label="实验分幕"><button v-for="(shot,i) in story.shots" :key="i" :aria-current="stage===i?'step':undefined" @click="seek(i/4)"><span>0{{i+1}}</span>{{shot[0]}}</button></nav>
  <div class="story-stage" :class="{expanded}">
   <div class="shot-heading"><span>第 {{stage+1}} 幕 · {{['观察对象','看清关系','追踪过程','对照结论'][stage]}}</span><strong>{{story.shots[stage][0]}}</strong></div>
   <div class="stage-scroll" tabindex="0" aria-label="实验舞台，放大时可横向滚动">
    <svg class="story-svg" viewBox="0 0 820 410" role="img" :aria-label="story.shots[stage][0]+'：'+model.status"><component v-for="(element,i) in model.elements" :key="i" :is="element.tag" v-bind="element.attrs">{{element.text}}</component></svg>
   </div>
   <p class="shot-caption" aria-live="polite">{{model.status}}</p>
   <div class="film-controls"><button class="play" :aria-pressed="playing" @click="play">{{playing?'暂停':progress===1?'重新播放':'播放过程'}}</button><button :disabled="stage===0" @click="seek((stage-1)/4)">上一幕</button><button :disabled="stage===3" @click="seek((stage+1)/4)">下一幕</button><button @click="reset">重置</button><button class="expand" :aria-pressed="expanded" @click="expanded=!expanded">{{expanded?'完整图示':'放大图示'}}</button></div>
   <div v-if="story.kind==='source'" class="source-sound-controls"><button :aria-pressed="sourceSoundEnabled" @click="toggleSourceSound">{{sourceSoundEnabled?'关闭音叉声音':'开启音叉声音'}}</button><label>音叉音量 <input v-model.number="volume" aria-label="音叉音量" type="range" min="0" max="1" step=".1" @input="sourceVolume"></label><span role="status">{{soundError||(sounding&&volume>0?'声源旁试听 · 440 Hz':!sourceSoundEnabled||volume===0?'已静音':!model.active?'叉股已停止，声源不再发声':'点击播放，听音叉声音')}}</span></div>
   <label class="timeline">动画进度 <output>{{Math.round(progress*100)}}%</output><input aria-label="动画进度" type="range" min="0" max="1" step=".001" :value="progress" @input="seek($event.target.value)"></label>
  </div>
  <div class="story-readings" aria-label="实时读数"><div v-for="[label,value] in model.stats" :key="label"><span>{{label}}</span><strong>{{value}}</strong></div></div>
  <div class="experiment-controls"><label v-for="control in story.controls" :key="control.key">{{control.label}}<template v-if="!control.options"><output>{{values[control.key]}} {{control.unit}}</output><input type="range" :aria-label="control.label" :min="control.min" :max="control.max" :step="control.step" :value="values[control.key]" @input="change(control.key,$event)"></template><select v-else :aria-label="control.label" :value="values[control.key]" @change="change(control.key,$event)"><option v-for="[value,label] in control.options" :key="value" :value="value">{{label}}</option></select></label></div>
  <div v-if="['pitch','loudness','timbre'].includes(story.kind)" class="sound-controls"><button :aria-pressed="sounding" @click="listen">{{sounding?'停止试听':'轻声试听（1秒）'}}</button><label>试听音量 <input v-model.number="volume" aria-label="试听音量" type="range" min="0" max="1" step=".1" @input="stopSound"></label><span>合成音仅用于比较；先将设备音量调低。</span></div>
  <details class="model-note"><summary>模型与参考说明</summary><p>{{story.note}}</p><p>播放时间用于分幕讲解，物理量以独立读数为准；调参后暂停并重新计算当前画面。</p><p>参考 <a href="https://github.com/HarleyCoops/Math-To-Manim" target="_blank" rel="noopener noreferrer">Math-To-Manim</a> 的分镜与计算组织，本页为原创网页交互改编。</p></details>
 </section>
</template>

<style scoped src="./physics-chapter-story.css"></style>
