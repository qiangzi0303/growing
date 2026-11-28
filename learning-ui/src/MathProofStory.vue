<script setup>
import {computed,ref,onMounted,onBeforeUnmount} from 'vue';
import {mathProofStories,proofDefaults,proofState} from './math-proof-model.js';
import narration from './math-proof-audio.json';
import {createProofPlayback,createProofAudioSource} from './math-proof-playback.js';
const props=defineProps({nodeId:{type:String,required:true},showConcepts:{type:Boolean,default:true}});
const story=mathProofStories[props.nodeId],values=ref(proofDefaults(props.nodeId)),progress=ref(0),playing=ref(false),expanded=ref(false);
const entry=narration[props.nodeId],audio=ref(null),voice=ref(true),loading=ref(false),error=ref(''),caption=ref(entry.cues[0].text);
const model=computed(()=>proofState(props.nodeId,values.value,progress.value)),stage=computed(()=>model.value.stage);
const difference=props.nodeId==='factor-difference';
const fmt=n=>Number(n.toFixed(2)).toString();
const points=poly=>poly.map(([x,y])=>`${60+x*model.value.scale},${120+y*model.value.scale}`).join(' ');
const x=n=>60+n*model.value.scale,y=n=>120+n*model.value.scale;
const center=poly=>({x:x(poly.reduce((s,p)=>s+p[0],0)/poly.length),y:y(poly.reduce((s,p)=>s+p[1],0)/poly.length)});
let player;
onMounted(()=>{
 const source=createProofAudioSource(audio.value);
 player=createProofPlayback({audio:audio.value,entry,prepareAudio:source.prepare,releaseAudio:source.dispose,onChange:s=>{progress.value=s.progress;playing.value=s.playing;loading.value=s.loading;voice.value=s.voice;error.value=s.error;caption.value=s.caption;}});
});
function pause(){player?.pause();}
function play(){player?.play();}
function seek(p){player?.seek(p);}
function change(key,value){pause();values.value={...values.value,[key]:Number(value)};}
function reset(){seek(0);values.value=proofDefaults(props.nodeId);}
function visibility(){if(document.hidden)pause();}
document.addEventListener('visibilitychange',visibility);
onBeforeUnmount(()=>{player?.dispose();document.removeEventListener('visibilitychange',visibility);});
</script>

<template>
 <section class="math-proof-story" :data-math-proof="nodeId" :data-proof-stage="stage" aria-label="数学分幕推导">
  <audio ref="audio" :src="entry.file" preload="none" hidden></audio>
  <section v-if="showConcepts" class="proof-concepts" aria-label="本节概念与定义">
   <h3>先理解概念与定义</h3>
   <dl><div v-for="[term,definition] in story.lesson.definitions" :key="term"><dt>{{term}}</dt><dd>{{definition}}</dd></div></dl>
   <p class="proof-concept-formula">{{story.lesson.formula}}</p>
   <p>{{story.lesson.symbols}}</p>
   <p><strong>适用条件：</strong>{{story.lesson.condition}}</p>
   <div class="proof-concept-key"><strong>易考点</strong><p>{{story.lesson.key}}</p></div>
   <div class="proof-concept-mistake"><strong>易错点</strong><p>{{story.lesson.mistake}}</p></div>
   <p class="proof-concept-bridge">{{story.lesson.bridge}}</p>
  </section>
  <header class="proof-heading"><p>动手推导</p><h3>{{story.title}}</h3><p>{{story.question}}</p></header>
  <nav class="proof-shots" aria-label="推导分幕"><button v-for="(shot,i) in story.shots" :key="i" :aria-current="stage===i?'step':undefined" @click="seek(i/4)"><small>0{{i+1}}</small>{{shot[0]}}</button></nav>
  <div class="proof-stage">
   <div class="proof-stage-heading"><strong>第 {{stage+1}} 幕 · {{story.shots[stage][0]}}</strong><button :aria-pressed="expanded" @click="expanded=!expanded">{{expanded?'适应屏幕':'放大图示'}}</button></div>
   <div class="proof-scroll" :class="{expanded}" tabindex="0" aria-label="推导图示，放大后可横向滚动">
    <svg viewBox="0 0 820 425" role="img" :aria-label="story.shots[stage][1]">
     <template v-if="difference">
      <text x="60" y="48" class="diagram-heading">原面积：a² − b²</text>
      <text v-if="stage===3" x="402" y="48" class="diagram-heading">同样两块，重新拼合</text>
      <rect :x="x(0)" :y="y(0)" :width="190" height="190" class="outline"/>
      <polygon v-for="(poly,i) in model.source" :key="'ghost'+i" :points="points(poly)" class="ghost"/>
      <polygon :points="points(model.cut)" class="removed" :opacity="stage===0?1:Math.max(.08,1-(progress-.25)*8)"/>
      <text v-if="stage<2" :x="x(model.d+model.b/2)" :y="y(model.b/2)+7" class="gold label" text-anchor="middle">b²</text>
      <text v-if="stage<2" :x="x(model.d+model.b/2)" :y="y(0)-18" class="gold label" text-anchor="middle">b = {{fmt(model.b)}}</text>
      <line v-if="stage===1" :x1="x(0)" :x2="x(model.d)" :y1="y(model.b)" :y2="y(model.b)" class="cut-line"/>
      <polygon :points="points(model.base)" class="piece blue-fill"/>
      <polygon :points="points(model.piece)" class="piece coral-fill"/>
      <text v-if="stage===0" :x="x(model.a/2)" :y="y(model.a)+30" class="label" text-anchor="middle">a = {{fmt(model.a)}}</text>
      <text v-if="stage===1" x="60" y="360" class="label">沿虚线剪开，保留这两块</text>
      <g v-if="stage===3">
       <rect :x="x(model.offset)" :y="y(model.b)" :width="(model.a+model.b)*model.scale" :height="model.d*model.scale" class="outline"/>
       <text :x="x(model.offset+(model.a+model.b)/2)" :y="y(model.a)+32" class="label" text-anchor="middle">a + b = {{fmt(model.a+model.b)}}</text>
       <text :x="x(model.offset+model.a/2)" :y="y(model.b+model.d/2)+7" class="blue label" text-anchor="middle">a</text>
       <text :x="x(model.offset+model.a+model.b/2)" :y="y(model.b+model.d/2)+7" class="coral label" text-anchor="middle">b</text>
       <text :x="x(model.offset)" :y="y(model.b)-22" class="label">宽 a − b = {{fmt(model.d)}}</text>
       <text x="60" y="366" class="equation">a² − b² = (a + b)(a − b)</text>
      </g>
     </template>
     <template v-else>
      <g v-if="stage===0">
       <polygon :points="points(model.triangle)" class="piece neutral-fill"/>
       <path :d="`M${x(.18)} ${y(0)}V${y(.18)}H${x(0)}`" class="right-angle"/>
       <text :x="x(model.a/2)" :y="y(0)-15" class="blue label">a</text>
       <text :x="x(0)-25" :y="y(model.b/2)" class="gold label">b</text>
       <text :x="x(model.a/2)+14" :y="y(model.b/2)+10" class="coral label">c</text>
       <text x="395" y="170" class="diagram-heading">先找直角，再找斜边</text>
       <text x="395" y="215" class="label">四块的直角边都为 a、b</text>
      </g>
      <g v-else>
       <text x="60" y="48" class="diagram-heading">摆法一：剩下 c²</text>
       <rect :x="x(0)" :y="y(0)" width="220" height="220" class="outline"/>
       <polygon :points="points(model.center)" class="coral-fill"/>
       <polygon v-for="(poly,i) in model.source" :key="'left'+i" :points="points(poly)" class="piece neutral-fill"/>
       <text v-for="(poly,i) in model.source" :key="'number'+i" :x="center(poly).x" :y="center(poly).y+6" class="piece-number" text-anchor="middle">{{i+1}}</text>
       <text :x="x(model.L/2)" :y="y(model.L/2)+7" class="coral equation" text-anchor="middle">c²</text>
       <text :x="x(model.L/2)" :y="y(model.L)+30" class="label" text-anchor="middle">边长 a + b</text>
       <g v-if="stage>=2">
        <text x="478" y="48" class="diagram-heading">摆法二：剩下 a² + b²</text>
        <rect :x="x(model.offset)" :y="y(0)" width="220" height="220" class="outline"/>
        <polygon v-for="(poly,i) in model.squares" :key="'square'+i" :points="points(poly)" :class="i?'gold-fill':'blue-fill'" :opacity="stage===3?1:.12"/>
        <polygon v-for="(poly,i) in model.pieces" :key="'right'+i" :points="points(poly)" class="piece neutral-fill"/>
        <text v-for="(poly,i) in model.pieces" :key="'right-number'+i" :x="center(poly).x" :y="center(poly).y+6" class="piece-number" text-anchor="middle">{{i+1}}</text>
        <text v-if="stage===3" v-for="(poly,i) in model.squares" :key="'area'+i" :x="center(poly).x" :y="center(poly).y+7" :class="['equation',i?'gold':'blue']" text-anchor="middle">{{i?'b²':'a²'}}</text>
        <text :x="x(model.offset+model.L/2)" :y="y(model.L)+30" class="label" text-anchor="middle">边长也为 a + b</text>
       </g>
       <text v-else x="380" y="185" class="label">四边长 c，四角都是直角</text>
       <text v-if="stage===3" x="410" y="405" text-anchor="middle" class="equation">c² = (a + b)² − 4 × ab/2 = a² + b²</text>
      </g>
     </template>
    </svg>
   </div>
   <p class="proof-caption" aria-live="off">{{caption}}</p>
   <div class="proof-playback"><button class="proof-primary" @click="play">{{playing?(loading?'加载中 · 暂停':'暂停'):progress>=1?'重新播放':'播放推导'}}</button><button :disabled="stage===0" @click="seek((stage-1)/4)">上一幕</button><button :disabled="stage===3" @click="seek((stage+1)/4)">下一幕</button><button @click="reset">重置</button><button :aria-pressed="voice" @click="player?.setVoice(!voice)">语音讲解：{{voice?'开':'关'}}</button></div>
   <p v-if="error" class="proof-audio-error" role="alert">{{error}}</p>
   <label class="proof-timeline">推导进度 <span>{{Math.round(progress*100)}}%</span><input aria-label="推导进度" type="range" min="0" max="1" step=".001" :value="progress" @input="seek($event.target.value)"/></label>
  </div>
  <div class="proof-values" aria-label="面积核对"><div><small>原面积</small><strong>{{fmt(model.outer)}}</strong></div><div><small>{{difference?'去掉的小正方形':'四个三角形合计'}}</small><strong>{{fmt(model.removed)}}</strong></div><div><small>剩余面积</small><strong>{{fmt(model.remaining)}}</strong></div></div>
  <div class="proof-parameters"><label v-for="control in story.controls" :key="control.key">{{control.label}} <output>{{fmt(values[control.key])}}</output><input type="range" :aria-label="control.label" :min="control.min" :max="control.max" :step="control.step" :value="values[control.key]" @input="change(control.key,$event.target.value)"/></label></div>
  <details class="proof-note"><summary>为什么成立 · 适用条件</summary><p>{{story.note}}</p></details>
 </section>
</template>

<style scoped>
.proof-concepts{margin-bottom:26px;font-size:15px;line-height:1.9}.proof-concepts h3{font-size:19px;margin:0 0 18px}.proof-concepts dl{margin:0}.proof-concepts dl>div{margin:14px 0}.proof-concepts dt{font-weight:650;margin-bottom:4px}.proof-concepts dd{margin:0;color:#405652}.proof-concepts p{margin:12px 0;line-height:1.9}.proof-concepts .proof-concept-formula{font-size:clamp(18px,4.8vw,25px);font-weight:650;line-height:1.6;padding:14px 0;color:#264e61;overflow-wrap:anywhere}.proof-concept-key,.proof-concept-mistake{padding:12px 16px;margin:14px 0;border-left:3px solid;border-radius:0 8px 8px 0}.proof-concept-key{border-color:#4084ad;background:#f0f7fc;color:#205675}.proof-concept-mistake{border-color:#c7734f;background:#fff5ef;color:#97492e}.proof-concepts .proof-concept-key p,.proof-concepts .proof-concept-mistake p{margin:5px 0 0}.proof-concepts .proof-concept-bridge{padding-top:16px;margin-top:20px;border-top:1px solid #dce3dc;color:#536763}
.proof-audio-error{color:#ffc5a9;font-size:13px;line-height:1.8;margin:14px 0 0}
.math-proof-story{margin:22px 0 30px;color:#263c3e;min-width:0}.proof-heading p{font-size:14px;line-height:1.7;margin:8px 0;color:#536763}.proof-heading>p:first-child{font-size:12px;color:#9a573d}.proof-heading h3{font-size:25px;line-height:1.4;margin:8px 0}.proof-shots{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:24px 0 16px;gap:8px}.math-proof-story button{font:inherit;cursor:pointer;min-height:44px}.proof-shots button{padding:10px 6px;text-align:left;border:0;border-bottom:2px solid #dce3dc;background:transparent;color:#536763;font-size:13px;line-height:1.5}.proof-shots small{display:block;margin-bottom:7px}.proof-shots [aria-current]{color:#a45439;border-bottom-color:#bd6c4f}.proof-stage{background:#111b20;color:#f6f3e9;border-radius:14px;padding:20px;overflow:hidden}.proof-stage-heading{display:flex;gap:12px;align-items:center;justify-content:space-between;font-size:13px}.proof-stage-heading button{border:1px solid #687577;background:transparent;color:inherit;border-radius:7px;padding:7px 12px;font-size:12px}.proof-scroll{overflow-x:auto;max-width:100%;margin-top:8px}.proof-scroll svg{display:block;width:100%;height:auto;min-width:0}.proof-scroll.expanded svg{min-width:780px}.proof-scroll:focus-visible{outline:2px solid #d6b875;outline-offset:-2px}.proof-stage svg text{font-family:"Segoe UI","Microsoft YaHei",sans-serif;fill:#f6f3e9}.diagram-heading{font-size:21px}.label{font-size:20px}.equation{font-size:24px}.piece-number{font-size:18px;fill:#b4c1c6!important}.outline{fill:none;stroke:#b6c5c7;stroke-width:1.5}.piece{stroke:#e4e9e5;stroke-width:1.6;stroke-linejoin:round}.blue-fill{fill:#355e73}.coral-fill{fill:#804f3e}.gold-fill{fill:#6e613a}.neutral-fill{fill:#273a43}.ghost{fill:none;stroke:#5c7075;stroke-width:1;stroke-dasharray:5 5}.removed{fill:#6e613a;stroke:#d6b875;stroke-width:1.4}.cut-line{stroke:#f5e2ac;stroke-dasharray:6 5;stroke-width:2.5}.right-angle{fill:none;stroke:#f6f3e9;stroke-width:2}.blue{fill:#8fc5df!important}.gold{fill:#e5c67d!important}.coral{fill:#f3a286!important}.proof-caption{font-size:15px;line-height:1.8;min-height:3.6em;margin:10px 0 18px;color:#f6f3e9}.proof-playback{display:flex;flex-wrap:wrap;gap:8px}.proof-playback button{background:transparent;color:inherit;border:1px solid #7d8a8a;border-radius:7px;padding:9px 14px;font-size:13px}.proof-playback .proof-primary{background:#d77b57;color:#101a1e;border-color:#d77b57;font-weight:600}.math-proof-story button:disabled{opacity:.4;cursor:default}.math-proof-story button:focus-visible,.math-proof-story input:focus-visible,.proof-note summary:focus-visible{outline:3px solid #a57442;outline-offset:3px}.proof-timeline{display:block;font-size:12px;margin:20px 0 0}.proof-timeline span{float:right}.math-proof-story input[type=range]{display:block;box-sizing:border-box;width:100%;min-height:36px;margin:5px 0 0;accent-color:#bc6d4e;cursor:pointer}.proof-values{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:22px 0;border-bottom:1px solid #dce3dc}.proof-values small{display:block;font-size:12px;line-height:1.6;color:#536763}.proof-values strong{display:block;font-size:23px;margin-top:8px;font-variant-numeric:tabular-nums}.proof-parameters{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:22px 0}.proof-parameters label{font-size:13px;line-height:1.7}.proof-parameters output{display:block;color:#9a573d;font-size:17px}.proof-note{font-size:13px;line-height:1.9;color:#536763}.proof-note summary{cursor:pointer;min-height:44px;align-content:center}.proof-note p{margin-top:4px}
@media(max-width:600px){.proof-heading h3{font-size:21px}.proof-shots{gap:4px;margin-top:18px}.proof-shots button{font-size:12px;padding:8px 3px}.proof-stage{padding:14px 12px}.proof-stage-heading{font-size:12px}.proof-stage-heading strong{max-width:60%;line-height:1.7}.proof-stage-heading button{padding:6px 8px}.proof-caption{font-size:14px;min-height:5.4em}.proof-playback{gap:6px}.proof-playback button{padding:8px 10px;font-size:12px}.proof-parameters{grid-template-columns:1fr;gap:14px}.proof-values{gap:8px}.proof-values strong{font-size:21px}}
</style>
