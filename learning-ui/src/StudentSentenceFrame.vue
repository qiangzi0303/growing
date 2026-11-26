<script setup>
import {onBeforeUnmount,ref,watch} from 'vue';
const props=defineProps({src:{type:String,required:true},active:{type:Boolean,default:true}});
const frame=ref(null),height=ref(700);
watch(()=>props.active,active=>{if(!active)frame.value?.contentWindow?.dispatchEvent(new Event('sentence:pause'));});
let observer;
function loaded(){
 observer?.disconnect();
 const doc=frame.value?.contentDocument,root=doc?.getElementById('sentence-app');
 if(!root)return;
 const resize=()=>{if(frame.value?.getClientRects().length)height.value=Math.max(450,Math.ceil(root.getBoundingClientRect().bottom+(doc.defaultView?.scrollY||0))+24);};
 observer=new ResizeObserver(resize);observer.observe(root);resize();
}
onBeforeUnmount(()=>observer?.disconnect());
</script>
<template><iframe ref="frame" data-sentence-study-frame title="句子闯关" :src="src" :style="{height:height+'px'}" @load="loaded"/></template>
<style scoped>iframe{display:block;width:100%;border:0;background:#fff;border-radius:12px}</style>
