<script setup>
import {ref,onBeforeUnmount} from 'vue';
import {Button,Cell} from 'vant';
import 'vant/es/button/style';import 'vant/es/cell/style';
const props=defineProps({model:{type:Object,required:true}});
const busy=ref(false),status=ref('');let alive=true;
onBeforeUnmount(()=>{alive=false;});
async function open(){if(busy.value)return;busy.value=true;status.value='';try{await props.model.openPapers();}catch(error){if(alive)status.value='试卷暂时无法打开：'+error.message;}finally{if(alive)busy.value=false;}}
</script>
<template>
 <main class="student-resources catalog-shell">
  <nav class="page-nav" aria-label="页面导航"><Button tag="a" :href="model.backHref" class="back-link" icon="arrow-left">{{model.backLabel}}</Button><span class="mini-brand"><img class="brand-logo" :src="'brand-logo.webp'" alt="" width="32" height="32">逆流</span></nav>
  <header class="catalog-heading"><div><p class="eyebrow">{{model.subjectName}}</p><h1>{{model.title}}</h1></div></header>
  <section class="my-papers" aria-labelledby="student-papers-title"><h2 id="student-papers-title">我的试卷</h2><div class="paper-entry student-photo-entry"><div><h3>拍照整理试卷</h3></div><nav aria-label="我的拍照试卷"><Button data-open-papers :loading="busy" loading-text="正在打开" @click="open">我的拍照试卷 / 拍照导入</Button></nav></div><p role="status" class="student-resource-status" :class="{'empty-status':!status}">{{status}}</p>
   <template v-for="group in model.groups.filter(g=>g.title!=='模型推导')" :key="group.title"><div class="paper-entry"><div><h3>{{group.title}}</h3></div><nav :aria-label="group.title+'资料'"><Cell v-for="link in group.links" :key="link.href" tag="a" :href="link.href" :title="link.title"/></nav></div></template>
  </section>
  <section v-for="group in model.groups.filter(g=>g.title==='模型推导')" :key="group.title" class="my-papers"><h2>{{group.title}}</h2><div v-for="link in group.links" :key="link.href" class="paper-entry"><div><h3>{{link.title}}</h3></div><nav aria-label="模型推导"><Cell tag="a" :href="link.href" title="进入模型推导"/></nav></div></section>
 </main>
</template>
<style scoped>
.student-resources{font:inherit;color:inherit}.page-nav>.van-button{font:inherit;height:auto;min-height:44px;padding:0;border:0;background:transparent;color:var(--ui-muted);font-size:14px}.student-photo-entry{margin-bottom:12px}.student-photo-entry .van-button{font:inherit;text-align:left;padding:14px 16px;height:auto;min-height:44px;border:1px solid #bbc8ae;border-radius:12px;color:inherit;background:#fff}.paper-entry .van-cell{width:auto;line-height:normal;overflow:visible}.paper-entry .van-cell:after{display:none}.paper-entry :deep(.van-cell__title){font:inherit;flex:initial}.paper-entry :deep(.van-cell__value){display:none}.student-resource-status{font-size:14px;color:#845d23;line-height:1.8;overflow-wrap:anywhere}.empty-status{margin:0}@media(max-width:600px){.student-photo-entry .van-button{white-space:normal}.paper-entry .van-cell{width:auto}}
</style>
