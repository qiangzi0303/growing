<script setup lang="ts">
import { useAuthStore } from '@/store/modules/auth';
import PwdLogin from './modules/pwd-login.vue';
const auth = useAuthStore();
</script>
<template>
  <main class="min-h-screen flex-center bg-layout p-16px">
    <NCard title="逆流 · 管理后台" class="w-400px max-w-full">
      <div v-if="auth.logoutError" role="alert">
        <p>{{ auth.logoutError }}</p>
        <NButton @click="auth.resetStore()">重试退出</NButton>
      </div>
      <PwdLogin />
      <p class="mt-16px"><a href="/?legacy=1#register">注册新账号</a></p>
    </NCard>
  </main>
</template>
