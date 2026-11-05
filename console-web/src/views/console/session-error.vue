<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/modules/auth';
import { safeReturn } from '@/features/session/policy';
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const busy = ref(false);
async function retry() {
  busy.value = true;
  await auth.initUserInfo();
  busy.value = false;
  if (!auth.restoreError) await router.replace(safeReturn(route.query.redirect).slice('/console'.length));
}
</script>
<template>
  <main class="p-24px">
    <h1>暂时无法恢复登录</h1>
    <p role="alert">{{ auth.restoreError?.message || '请检查网络后重试。' }}</p>
    <NButton :loading="busy" @click="retry">重试</NButton>
  </main>
</template>
