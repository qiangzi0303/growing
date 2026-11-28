<script setup>
import {Loading,Button} from 'vant';
import 'vant/es/loading/style';import 'vant/es/button/style';
defineProps({loading:Boolean,label:{type:String,default:'正在读取…'},error:String,empty:String,retry:Boolean,skeleton:Boolean});
defineEmits(['retry']);
</script>
<template><div v-if="loading||error||empty" class="loading-state" :aria-busy="loading" role="status" aria-live="polite"><template v-if="loading"><Loading size="18">{{label}}</Loading><div v-if="skeleton" class="loading-lines" aria-hidden="true"><i/><i/></div></template><template v-else-if="error"><p>{{error}}</p><Button v-if="retry" size="small" @click="$emit('retry')">重新读取</Button></template><p v-else>{{empty}}</p></div></template>
<style scoped>.loading-state{padding:14px 0;color:#596c60;font-size:14px}.loading-state p{margin:0 0 8px}.loading-lines{display:grid;gap:10px;margin-top:14px}.loading-lines i{display:block;height:12px;width:85%;border-radius:4px;background:#e8eee5}.loading-lines i:last-child{width:56%}</style>
