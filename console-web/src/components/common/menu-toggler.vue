<script lang="ts" setup>
import { $t } from '@/locales';

defineOptions({ name: 'MenuToggler' });

interface Props {
  /** Show collapsed icon */
  collapsed?: boolean;
  /** Arrow style icon */
  arrowIcon?: boolean;
  zIndex?: number;
}

withDefaults(defineProps<Props>(), {
  arrowIcon: false,
  zIndex: 98
});

</script>

<template>
  <ButtonIcon
    :key="String(collapsed)"
    :tooltip-content="collapsed ? $t('icon.expand') : $t('icon.collapse')"
    tooltip-placement="bottom-start"
    :z-index="zIndex"
  >
    <icon-ph-caret-double-right-bold v-if="arrowIcon && collapsed" />
    <icon-ph-caret-double-left-bold v-else-if="arrowIcon" />
    <icon-ph-list v-else-if="collapsed" />
    <icon-ph-sidebar-simple v-else />
  </ButtonIcon>
</template>

<style scoped></style>
