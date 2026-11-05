<script setup lang="ts">
import { computed, onUnmounted, reactive, watch } from 'vue';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { $t } from '@/locales';
import { useAuthStore } from '@/store/modules/auth';
import { useNaiveForm } from '@/hooks/common/form';
import { landing, safeReturn } from '@/features/session/policy';

defineOptions({
  name: 'PwdLogin'
});

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const error = ref('');
const submitting = ref(false);
const { formRef, validate } = useNaiveForm();

interface FormModel {
  userName: string;
  password: string;
}

const model: FormModel = reactive({
  userName: '',
  password: ''
});

function clearPassword() {
  model.password = '';
}

watch(() => authStore.sessionRevision, clearPassword, { flush: 'sync' });
onUnmounted(clearPassword);

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  // inside computed to make locale reactive, if not apply i18n, you can define it without computed
  return {
    userName: [
      {
        required: true,
        validator: (_rule, value: string) =>
          /^[\p{L}\p{N}_]{2,24}$/u.test((value || '').trim()) || new Error('用户名需为 2–24 位文字、数字或下划线。'),
        trigger: 'blur'
      }
    ],
    password: [
      {
        required: true,
        validator: (_rule, value: string) =>
          (typeof value === 'string' && value.length >= 8 && value.length <= 128) ||
          new Error('密码需为 8–128 位字符。'),
        trigger: 'blur'
      }
    ]
  };
});

async function handleSubmit() {
  if (submitting.value || authStore.loginLoading) return;
  submitting.value = true;
  try {
    try {
      await validate();
    } catch {
      return;
    }
    const ok = await authStore.login(model.userName.trim(), model.password);
    if (!ok) {
      error.value = '登录失败，请核对账号密码或检查网络后重试。';
      return;
    }
    error.value = '';
    const target = landing(authStore.profile);
    if (target === '/' || target.startsWith('/?')) window.location.replace(target);
    else
      await router.replace(
        target === '/console/home' ? safeReturn(route.query.redirect).slice('/console'.length) : '/403'
      );
  } finally {
    clearPassword();
    submitting.value = false;
  }
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" @keyup.enter="handleSubmit">
    <NFormItem path="userName" label="用户名" :show-label="true">
      <NInput v-model:value="model.userName" :input-props="{ 'aria-label': '用户名' }" :placeholder="$t('page.login.common.userNamePlaceholder')" />
    </NFormItem>
    <NFormItem path="password" label="密码" :show-label="true">
      <NInput
        v-model:value="model.password"
        type="password"
        :input-props="{ 'aria-label': '密码' }"
        show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      />
    </NFormItem>
    <p v-if="error" role="alert">{{ error }}</p>
    <NButton type="primary" size="large" block :loading="submitting || authStore.loginLoading" @click="handleSubmit">登录</NButton>
  </NForm>
</template>

<style scoped></style>
