<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { Stroke } from '../api';
const props = defineProps<{ strokes: Stroke[]; photo?: string | null; page: number }>();
const canvas = ref<HTMLCanvasElement | null>(null); const imageError = ref(false);
watch(() => [props.strokes, props.photo], async () => {
  imageError.value = false; await nextTick(); const ctx = canvas.value?.getContext('2d'); if (!ctx) return;
  ctx.clearRect(0, 0, 800, 1100); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const stroke of props.strokes) {
    ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over'; ctx.strokeStyle = ctx.fillStyle = '#182a3a';
    stroke.points.forEach((point, i) => {
      const previous = stroke.points[Math.max(0, i - 1)]; const width = stroke.width * (stroke.tool === 'eraser' ? 1 : .35 + .65 * point[2]);
      ctx.lineWidth = width; ctx.beginPath();
      if (i === 0) { ctx.arc(point[0], point[1], width / 2, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.moveTo(previous[0], previous[1]); ctx.lineTo(point[0], point[1]); ctx.stroke(); }
    });
  }
  ctx.globalCompositeOperation = 'source-over';
}, { immediate: true, deep: true });
</script>
<template>
  <div class="original-page"><img v-if="photo && !imageError" :src="photo" :alt="`第 ${page} 页原稿照片底图`" @error="imageError = true" /><canvas ref="canvas" width="800" height="1100" :aria-label="`第 ${page} 页手写原稿`" /></div>
  <p v-if="imageError" role="alert">原稿照片无法加载，笔迹仍保留。</p>
</template>
<style scoped>.original-page { position: relative; max-width: 800px; background: white; border: 1px solid #d8e0d9; } canvas { display: block; width: 100%; height: auto; position: relative; } img { position: absolute; width: 100%; height: 100%; inset: 0; }</style>
