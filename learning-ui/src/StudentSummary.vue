<script setup>
import {Button,Tag} from 'vant';
import 'vant/es/button/style';import 'vant/es/tag/style';
defineProps({model:{type:Object,required:true}});
</script>
<template>
 <main class="student-summary summary-shell">
  <nav class="summary-nav" aria-label="课程导航"><Button tag="a" :href="model.backHref">{{model.backLabel||'返回目录'}}</Button><Button tag="a" href="index.html" class="brand" aria-label="逆流，选择课程"><img class="brand-logo" :src="'brand-logo.webp'" alt="" width="32" height="32">逆流</Button></nav>
  <header><p v-if="model.eyebrow" class="eyebrow">{{model.eyebrow}}</p><h1>{{model.title}}</h1></header>
  <p v-if="model.kind==='error'" role="status">{{model.message}}</p>
  <div v-else class="summary-groups"><section v-for="group in model.groups" :key="group.key" :class="['summary-group',group.key]" :aria-labelledby="'student-summary-'+group.key"><h2 :id="'student-summary-'+group.key">{{group.label}} <Tag>{{group.rows.length}}</Tag></h2><ul v-if="group.rows.length"><li v-for="row in group.rows" :key="row.id" :data-summary-node="row.id">{{row.title}}</li></ul><p v-else class="summary-empty">暂无</p></section></div>
  <p v-if="model.warnings?.length" class="summary-warning" role="status">部分学习记录暂不可用。{{model.warnings.join(' ')}}</p>
 </main>
</template>
<style scoped>
.student-summary{font:inherit;color:inherit}.summary-nav .van-button{min-height:44px;height:auto;padding:0;background:transparent;border:0;color:inherit;font:inherit;text-decoration:none}.summary-nav .brand :deep(.van-button__text){display:flex;align-items:center;gap:9px}.summary-nav .brand-logo{width:32px;height:32px}.summary-group :deep(.van-tag){background:var(--tint);color:var(--tone);font-weight:400;display:inline-block}.student-summary header{margin:34px 0 28px}@media(max-width:600px){.student-summary header{margin:24px 0}}
</style>
