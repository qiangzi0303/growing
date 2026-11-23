<script setup>
import { Button } from 'vant';
import 'vant/es/button/style';
defineProps({services:{type:Object,required:true}});
const emit=defineEmits(['close']);
</script>
<template><section class="student-course-settings course-ai-settings" aria-label="学习设置"><header><h2>学习设置</h2><Button icon="cross" aria-label="关闭设置" @click="emit('close')"/></header><p>AI 模型由管理后台统一配置，登录后自动获取，无需填写个人密钥。</p></section></template>
<style scoped>.student-course-settings{margin:20px 0;padding:18px;border:1px solid var(--ui-line,#dce6e0);border-radius:12px}.student-course-settings header{display:flex;align-items:center;justify-content:space-between;background:transparent}.student-course-settings h2{font-size:20px;margin:0}.student-course-settings p{line-height:1.8}.student-course-settings :deep(.van-button){min-width:44px;min-height:44px}</style>
