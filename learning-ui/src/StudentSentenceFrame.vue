<script setup>
import {onBeforeUnmount,ref,watch} from 'vue';
import {markPomodoroNode} from './english-pomodoro-markers.js';
const props=defineProps({src:{type:String,required:true},active:{type:Boolean,default:true},target:{type:Object,default:null},actions:{type:Object,default:()=>({})},pomodoroTargets:{type:Array,default:()=>[]},pomodoroPaused:{type:Boolean,default:false}});
const frame=ref(null),height=ref(700);
watch(()=>props.active,active=>{if(!active)frame.value?.contentWindow?.dispatchEvent(new Event('sentence:pause'));});
let observer,loadedDocument=null,lastRequest=null,removeRendered;
function syncMarkers(){
 const unit=new URL(props.src,location.href).searchParams.get('unit');
 frame.value?.contentDocument?.querySelectorAll('[data-pomodoro-topic],[data-pomodoro-sentence]').forEach(node=>{
  const target=props.pomodoroTargets.find(t=>t.kind==='sentence'&&t.unitId===unit&&(node.dataset.pomodoroSentence?t.sentenceId===node.dataset.pomodoroSentence:t.topicId===node.dataset.pomodoroTopic));
  markPomodoroNode(node,target,props.pomodoroPaused||!props.active);
 });
}
watch([()=>props.pomodoroTargets,()=>props.pomodoroPaused,()=>props.active],syncMarkers,{deep:true});
async function applyTarget(){
 const target=props.target,child=frame.value?.contentWindow;
 if(!loadedDocument||!target)return;
 const request=JSON.stringify([target.requestId,target.topicId,target.sentenceId]);
 if(request===lastRequest)return;
 lastRequest=request;
 try{
  const url=new URL(props.src,location.href);url.searchParams.set('topic',target.topicId);url.searchParams.set('sentence',target.sentenceId);
  if(await child?.GrowingEnglishSentenceStudy?.navigate(url.href)!==true)throw Error('句子定位失败，请重试。');
 }catch(error){props.actions.pomodoroTargetError?.(error.message||'句子定位失败');}
}
watch(()=>props.target,applyTarget,{deep:true});
function loaded(){
 observer?.disconnect();
 const doc=frame.value?.contentDocument,root=doc?.getElementById('sentence-app');
 if(!root)return;
 const resize=()=>{if(frame.value?.getClientRects().length)height.value=Math.max(450,Math.ceil(root.getBoundingClientRect().bottom+(doc.defaultView?.scrollY||0))+24);};
 observer=new ResizeObserver(resize);observer.observe(root);resize();
 if(loadedDocument!==doc){loadedDocument=doc;lastRequest=null;}
 const child=frame.value.contentWindow;
 removeRendered?.();child.addEventListener('english-sentence-rendered',syncMarkers);
 removeRendered=()=>child.removeEventListener('english-sentence-rendered',syncMarkers);
 syncMarkers();
 applyTarget();
}
onBeforeUnmount(()=>{observer?.disconnect();removeRendered?.();});
</script>
<template><iframe ref="frame" data-sentence-study-frame title="句子闯关" :src="src" :style="{height:height+'px'}" @load="loaded"/></template>
<style scoped>iframe{display:block;width:100%;border:0;background:#fff;border-radius:12px}</style>
