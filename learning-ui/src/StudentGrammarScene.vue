<script setup>
import {computed,onBeforeUnmount,ref} from 'vue';
const props=defineProps({unit:{type:String,default:'english-8a-05'},lesson:{type:String,required:true},actions:{type:Object,required:true}});
const frame=ref(null),height=ref(850);
const src=computed(()=>{
 const loader=document.querySelector('script[src*="student-pages.js"]');
 const base=loader?new URL('./',loader.src):new URL(location.pathname.includes('/word-ops-unit3/')?'../app-design/':'./',location.href);
 return new URL('english-point-scenes.html?'+new URLSearchParams({embed:'1',unit:props.unit,lesson:props.lesson,v:'20261126-points-1'}),base).href;
});
let observer;
function loaded(){
 observer?.disconnect();
 const doc=frame.value?.contentDocument,root=doc?.querySelector('main');
 if(!root)return;
 const resize=()=>{height.value=Math.ceil(root.getBoundingClientRect().height)+4;};
 observer=new ResizeObserver(resize);observer.observe(root);resize();
 const child=frame.value.contentWindow,connect=()=>child.GrowingEnglishPointStudy?.connect({read:props.actions.pointRead,write:props.actions.pointSave});
 if(child.GrowingEnglishPointStudy)connect();else child.addEventListener('english-points-ready',connect,{once:true});
}
onBeforeUnmount(()=>observer?.disconnect());
</script>
<template><section class="grammar-animation" aria-label="要点讲练"><iframe ref="frame" data-grammar-scene-frame :title="'要点讲练：'+lesson" :src="src" :style="{height:height+'px'}" @load="loaded"/></section></template>
<style scoped>.grammar-animation{margin:24px 0 30px}iframe{display:block;width:100%;border:0;background:#fff}</style>
