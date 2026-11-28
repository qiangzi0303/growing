<script setup>
import {useImagePreview} from './image-preview.js';
const previewImage=useImagePreview();
import {ref} from 'vue';
import {Button} from 'vant';
defineProps({uploads:{type:Array,default:()=>[]}});
const failed=ref({});
const time=value=>new Date(value).toLocaleString('zh-CN');
</script>
<template>
 <details v-if="uploads.length" class="upload-history">
  <summary>上传记录（{{uploads.length}}）</summary>
  <article v-for="upload in uploads" :key="upload.key">
   <p>最后保存：<time :datetime="upload.updatedAt">{{time(upload.updatedAt)}}</time> · {{upload.status==='graded'?'已批改':'未批改或待复核'}}</p>
   <div class="upload-images"><Button v-for="(photo,i) in upload.photos" :key="i" aria-label="查看这次上传原稿" @click="previewImage({images:upload.photos,startPosition:i})"><img v-if="!failed[photo]" :src="photo" :alt="'上传原稿第 '+(i+1)+' 页'" loading="lazy" @error="failed[photo]=true"><span v-else>原稿无法显示</span><span class="upload-page">第 {{i+1}} 页</span></Button></div>
   <p v-if="!upload.grades.length">尚无批改记录</p>
   <div v-for="(grade,i) in upload.grades" :key="i"><p>{{grade.historical?'历史批改':'本份原稿批改'}} · {{grade.needsReview?'待复核':grade.score+' / 100'}} · {{time(grade.at)}}</p><p>{{grade.feedback}}</p></div>
  </article>
 </details>
</template>
<style scoped>
.upload-page{display:block;margin-top:6px}.upload-history{margin:16px 0}.upload-history summary{cursor:pointer;padding:12px 0}.upload-history article{border-top:1px solid #dde5df;padding:12px 0}.upload-images{display:flex;flex-wrap:wrap;gap:10px}.upload-images :deep(.van-button){height:auto;padding:4px}.upload-images img{display:block;max-width:140px;max-height:170px;object-fit:contain}
</style>
