<script setup>
defineProps({card:{type:Object,default:null}});
</script>
<template>
 <figure v-if="card?.art" class="study-art">
  <img :src="card.art" :alt="card.scene" width="512" height="512">
  <figcaption>{{ card.scene }}</figcaption>
 </figure>
</template>
<style scoped>
.study-art{margin:0;min-width:0}.study-art img{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:contain;border-radius:10px}.study-art figcaption{margin-top:12px;font-size:14px;line-height:1.7;color:#53675c}
@media(max-width:650px){.study-art img{max-width:300px;margin-inline:auto}}
</style>
