<script setup>
import {markerSvg} from './english-pomodoro-markers.js';
import './english-pomodoro-marker.css';
defineProps({target:{type:Object,default:null},paused:{type:Boolean,default:false}});
</script>
<template><span v-if="target" class="english-pomo-marker" :class="{'is-paused':paused}" :data-pomodoro-target="target.id" role="img" lang="zh" aria-label="当前番茄待学内容" title="当前番茄待学内容" v-html="markerSvg"/></template>
