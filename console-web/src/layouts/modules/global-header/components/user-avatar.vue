<script setup lang="ts">
import { computed } from 'vue';
import type { VNode } from 'vue';
import { $t } from '@/locales';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';

defineOptions({
  name: 'UserAvatar'
});

const authStore = useAuthStore();
const { routerPushByKey, toLogin } = useRouterPush();

function loginOrRegister() {
  toLogin();
}

type DropdownKey = 'logout';

type DropdownOption =
  | {
      key: DropdownKey;
      label: string;
      icon?: () => VNode;
    }
  | {
      type: 'divider';
      key: string;
    };

const options = computed(() => {
  const opts: DropdownOption[] = [
    {
      label: $t('common.logout'),
      key: 'logout'
    }
  ];

  return opts;
});

function logout() {
  window.$dialog?.info({
    title: $t('common.tip'),
    content: $t('common.logoutConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => authStore.resetStore()
  });
}

function handleDropdown(key: DropdownKey) {
  if (key === 'logout') {
    logout();
  } else {
    // If your other options are jumps from other routes, they will be directly supported here
    routerPushByKey(key);
  }
}
</script>

<template>
  <div v-if="authStore.logoutError" role="alert" class="flex items-center gap-8px">
    <span>{{ authStore.logoutError }}</span>
    <NButton @click="authStore.resetStore()">重试退出</NButton>
  </div>
  <NButton v-if="!authStore.isLogin" quaternary @click="loginOrRegister">
    {{ $t('page.login.common.loginOrRegister') }}
  </NButton>
  <NDropdown v-else placement="bottom" trigger="click" :options="options" @select="handleDropdown">
    <div>
      <ButtonIcon>
        <SvgIcon local-icon="avatar" class="text-icon-large" />
        <span class="max-w-120px truncate text-16px font-medium">{{ authStore.userInfo.userName }}</span>
      </ButtonIcon>
    </div>
  </NDropdown>
</template>

<style scoped></style>
