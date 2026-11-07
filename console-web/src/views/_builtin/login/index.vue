<script setup lang="ts">
import { NAlert, NButton, NCard } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import PwdLogin from './modules/pwd-login.vue';
const auth = useAuthStore();
</script>
<template>
  <main class="min-h-screen flex-center bg-layout p-16px">
    <NCard title="逆流 · 管理后台" class="w-400px max-w-full">
      <NAlert v-if="auth.logoutError" type="error" role="alert">
        <p>{{ auth.logoutError }}</p>
        <NButton @click="auth.resetStore()">重试退出</NButton>
      </NAlert>
      <PwdLogin />
      <p class="mt-16px"><NButton tag="a" text type="primary" href="/?legacy=1#register">注册新账号</NButton></p>
    </NCard>
  </main>
</template>
