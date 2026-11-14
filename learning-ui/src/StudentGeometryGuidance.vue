<script setup>
import {computed,ref,watch} from 'vue';
import {Button,Popup} from 'vant';
const props=defineProps({guide:{type:Object,required:true}});
const mode=ref('self'),hintCount=ref(0),stepIndex=ref(0),why=ref(false),zoom=ref(false);
const step=computed(()=>props.guide.steps[stepIndex.value]);
const figure=computed(()=>mode.value==='steps'?step.value.svg:hintCount.value?props.guide.hints[hintCount.value-1].svg:props.guide.svg);
const panelId=computed(()=>'guidance-'+props.guide.id);
function reset(){mode.value='self';hintCount.value=0;stepIndex.value=0;why.value=false;zoom.value=false;}
function hint(){mode.value='hints';hintCount.value=Math.min(hintCount.value+1,props.guide.hints.length);}
function solution(){mode.value='steps';stepIndex.value=0;why.value=false;}
function turn(delta){stepIndex.value=Math.max(0,Math.min(props.guide.steps.length-1,stepIndex.value+delta));why.value=false;}
watch(()=>props.guide.id,reset);
</script>
<template>
 <section class="geometry-guidance" :aria-label="'第'+guide.id.split('-').at(-1)+'题思路引导'">
  <div class="guidance-figure" v-html="figure"/>
  <div class="guidance-actions">
   <Button v-if="mode!=='steps'&&hintCount<guide.hints.length" :aria-controls="panelId" :aria-expanded="mode==='hints'" @click="hint">{{hintCount?'再给一点提示':'给我一点提示'}}</Button>
   <Button v-if="mode!=='steps'" :aria-controls="panelId" :aria-expanded="false" @click="solution">看解题思路</Button>
   <Button v-if="mode!=='self'" @click="reset">自己再想想</Button>
   <Button aria-label="放大当前题图" @click="zoom=true">放大题图</Button>
  </div>
  <div :id="panelId" class="guidance-content" aria-live="polite">
   <ol v-if="mode==='hints'" class="guidance-hints"><li v-for="(item,i) in guide.hints.slice(0,hintCount)" :key="i">{{item.text}}</li></ol>
   <section v-if="mode==='steps'" class="guidance-step">
    <p class="guidance-position">{{stepIndex+1}} / {{guide.steps.length}}</p>
    <h4>{{step.title}}</h4><p>{{step.text}}</p>
    <Button data-guidance-why :aria-expanded="why" :aria-controls="panelId+'-why'" @click="why=!why">{{why?'收起原因':'为什么这样想'}}</Button>
    <dl v-if="why" :id="panelId+'-why'" class="guidance-why">
     <dt>想解决什么？</dt><dd>{{step.why.goal}}</dd>
     <dt>看到了什么？</dt><dd>{{step.why.noticed}}</dd>
     <dt>为什么这样做？</dt><dd>{{step.why.reason}}</dd>
    </dl>
    <nav class="guidance-actions" aria-label="解题步骤"><Button :disabled="stepIndex===0" @click="turn(-1)">上一步</Button><Button :disabled="stepIndex===guide.steps.length-1" @click="turn(1)">下一步</Button></nav>
   </section>
  </div>
  <Popup v-model:show="zoom" teleport="body" round class="guidance-zoom" role="dialog" aria-label="当前题图" @keydown.esc="zoom=false">
   <Button aria-label="关闭放大题图" @click="zoom=false">关闭</Button><div v-html="figure"/>
  </Popup>
 </section>
</template>
<style scoped>
.geometry-guidance{margin:14px 0 22px;color:var(--ui-ink,#24352e);font-size:15px;line-height:1.8;overflow-wrap:anywhere}
.guidance-figure{width:100%;max-width:400px;margin:0 auto 10px}.guidance-figure :deep(svg){display:block;width:100%;height:auto;max-height:250px}
.guidance-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.geometry-guidance :deep(.van-button){font-size:14px;min-height:44px;height:auto;padding:8px 12px}
.guidance-content{max-width:100%}.guidance-hints{padding-left:24px;margin:14px 0}.guidance-hints li{margin:8px 0}
.guidance-step{margin-top:16px;padding:16px 0;border-top:1px solid var(--ui-line,#dce4dc)}.guidance-step h4{margin:4px 0 10px;font-size:16px}.guidance-step p{margin:8px 0}.guidance-step .guidance-position{color:var(--ui-muted,#64746b);font-size:14px}
.guidance-why{margin:14px 0;padding:0 0 0 14px;border-left:3px solid var(--ui-accent,#22634b)}.guidance-why dt{font-weight:600;margin-top:10px}.guidance-why dd{margin:3px 0 10px}
.guidance-zoom{box-sizing:border-box;width:min(94vw,760px);max-height:90dvh;padding:16px;overflow:auto;background:var(--ui-surface,#fff)}.guidance-zoom>button{display:block;margin:0 0 12px auto;min-height:44px}.guidance-zoom :deep(svg){display:block;width:100%;height:auto}
@media(max-width:390px){.guidance-actions{gap:6px}.geometry-guidance :deep(.van-button){padding:8px 10px}}
</style>
