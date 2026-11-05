<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
</script>
<template>
  <NCard :title="String(route.meta.title)"><p>此页面正在迁移，尚未加载业务数据。</p></NCard>
</template>
