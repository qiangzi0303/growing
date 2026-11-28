<script setup>
import {computed,onBeforeUnmount,ref,watch} from 'vue';
import {markPomodoroNode} from './english-pomodoro-markers.js';
const props=defineProps({unit:{type:String,default:'english-8a-05'},lesson:{type:String,required:true},actions:{type:Object,required:true},target:{type:Object,default:null},pomodoroTargets:{type:Array,default:()=>[]},pomodoroPaused:{type:Boolean,default:false}});
const frame=ref(null),height=ref(850);
const src=computed(()=>{
 const loader=document.querySelector('script[src*="student-pages.js"]');
 const base=loader?new URL('./',loader.src):new URL(location.pathname.includes('/word-ops-unit3/')?'../app-design/':'./',location.href);
 return new URL('english-point-scenes.html?'+new URLSearchParams({embed:'1',unit:props.unit,lesson:props.lesson,v:'20261128-patient-1'}),base).href;
});
let observer,connected=null,lastRequest=null,removeReady;
function syncMarkers(){
 frame.value?.contentDocument?.querySelectorAll('#point-tabs [data-point]').forEach(node=>{
  const target=props.pomodoroTargets.find(t=>t.kind==='point'&&t.unitId===props.unit&&t.lessonId===props.lesson&&node.id==='point-tab-'+t.pointId);
  markPomodoroNode(node,target,props.pomodoroPaused);
 });
}
watch([()=>props.pomodoroTargets,()=>props.pomodoroPaused],syncMarkers,{deep:true});
function applyTarget(){
 const target=props.target;
 if(!connected||!target||target.lessonId!==props.lesson)return;
 const request=JSON.stringify([target.requestId,target.lessonId,target.pointId]);
 if(request===lastRequest)return;
 lastRequest=request;
 try{if(connected.selectPoint(target.pointId)!==true)throw Error('当前要点无法切换，请先保存作答后重试。');}
 catch(error){props.actions.pomodoroTargetError?.(error.message||'要点定位失败');}
}
watch(()=>props.target,applyTarget,{deep:true});
function loaded(){
 observer?.disconnect();
 const doc=frame.value?.contentDocument,root=doc?.querySelector('main');
 if(!root)return;
 const resize=()=>{height.value=Math.ceil(root.getBoundingClientRect().height)+4;};
 observer=new ResizeObserver(resize);observer.observe(root);resize();
 const child=frame.value.contentWindow,connect=()=>{
  const api=child.GrowingEnglishPointStudy;if(!api||api===connected)return;
  try{api.connect({read:props.actions.pointRead,write:props.actions.pointSave});connected=api;lastRequest=null;applyTarget();syncMarkers();}
  catch(error){props.actions.pomodoroTargetError?.(error.message||'要点课堂连接失败');}
 };
 removeReady?.();removeReady=()=>child.removeEventListener('english-points-ready',connect);
 if(child.GrowingEnglishPointStudy)connect();else child.addEventListener('english-points-ready',connect,{once:true});
}
onBeforeUnmount(()=>{observer?.disconnect();removeReady?.();});
</script>
<template><section class="grammar-animation" aria-label="要点讲练"><iframe ref="frame" data-grammar-scene-frame :title="'要点讲练：'+lesson" :src="src" :style="{height:height+'px'}" @load="loaded"/></section></template>
<style scoped>.grammar-animation{margin:24px 0 30px}iframe{display:block;width:100%;border:0;background:#fff}</style>
