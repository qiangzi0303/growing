<script setup>
import { Cell,CellGroup } from 'vant';
import 'vant/es/cell/style';
import 'vant/es/cell-group/style';
defineProps({model:{type:Object,required:true}});
</script>
<template>
 <section class="student-home" aria-label="选择学科">
  <CellGroup class="subjects student-subjects" :border="false">
   <Cell v-for="subject in model.subjects" :key="subject.id" tag="a" :href="`units.html?subject=${subject.id}`" class="subject-card student-subject" :class="subject.id" :data-subject="subject.id" :aria-labelledby="subject.id+'-title '+subject.id+'-topic'">
    <template #default>
     <span v-if="subject.id==='english'" class="subject-icon letters" aria-hidden="true">Aa</span>
     <span v-else class="subject-icon" aria-hidden="true"><svg v-if="subject.id==='math'" viewBox="0 0 64 64" fill="none"><rect x="11" y="9" width="42" height="46" rx="10" stroke="currentColor" stroke-width="2"/><path d="M22 22h20M25 33v12m-6-6h12m6-4 8 8m0-8-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><svg v-else viewBox="0 0 48 48" fill="none"><ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(-45 24 24)" stroke="currentColor" stroke-width="1.7"/><ellipse cx="24" cy="24" rx="20" ry="8" transform="rotate(45 24 24)" stroke="currentColor" stroke-width="1.7"/><circle cx="24" cy="24" r="3" fill="currentColor"/></svg></span>
     <div class="subject-copy"><h2 :id="subject.id+'-title'">{{subject.name}}</h2><p :id="subject.id+'-topic'">{{subject.description}}</p></div>
    </template>
   </Cell>
  </CellGroup>
 </section>
</template>
<style scoped>
.student-home{font:inherit;color:inherit}.student-home>.welcome{text-align:left;display:grid;grid-template-columns:64px 1fr;column-gap:18px;margin:0 0 40px;align-items:center}.student-home>.welcome h1{margin:0;padding:0;font-size:26px;letter-spacing:0}.student-home>.welcome p{margin:0;font-size:14px;letter-spacing:0;color:var(--ui-muted)}
.student-subjects{background:transparent}.student-subject.van-cell{display:flex;flex-direction:column;line-height:inherit;overflow:visible;min-height:244px;padding:28px;background:var(--ui-surface,#fff);border:1px solid var(--ui-line,#e0e6e1);border-radius:12px;color:var(--ui-ink,#25332c)}.student-subject.van-cell:after{display:none}.student-subject :deep(.van-cell__value){display:contents;color:inherit;text-align:inherit;overflow:visible}.student-subject :deep(.van-cell__value--alone){color:inherit}
@media(max-width:600px){.student-home>.welcome{grid-template-columns:52px 1fr;column-gap:14px;margin-bottom:28px}.student-home>.welcome h1{font-size:24px}.student-home>.welcome p{font-size:13px}.student-subject.van-cell{display:grid;min-height:148px;grid-template-columns:44px minmax(0,1fr);gap:14px 18px;padding:20px}}
</style>
