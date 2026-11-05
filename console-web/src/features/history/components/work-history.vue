<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NAlert, NButton } from 'naive-ui';
import type { StudentIdentity } from '@/features/students/api';
import { formatBeijing } from '@/features/reports/api';
import { manuscript, manuscripts, photo, photos, verdictLabel } from '../api';
import type { ManuscriptRow, Page, PhotoRow } from '../api';
import { useHistoryQuery } from '../use-history-query';
import OriginalCanvas from './original-canvas.vue';
const props = defineProps<{ student: StudentIdentity }>();
const source = ref('handwriting'); const page = ref(1); const selected = ref(''); const gradeId = ref('');
watch(() => [props.student.id, source.value], () => { page.value = 1; selected.value = ''; gradeId.value = ''; }, { flush: 'sync' });
watch(page, () => { selected.value = ''; }, { flush: 'sync' });
const list = useHistoryQuery<Page<ManuscriptRow> | Page<PhotoRow>>(() => props.student.id, () => `${source.value}:${page.value}`, (role, signal) => source.value === 'handwriting' ? manuscripts(role, props.student.id, page.value, signal) : photos(props.student.id, page.value, signal));
const hand = useHistoryQuery(() => props.student.id, () => `${source.value}:${selected.value}`, (role, signal) => source.value === 'handwriting' && selected.value ? manuscript(role, props.student.id, selected.value, signal) : Promise.resolve(null));
const review = useHistoryQuery(() => props.student.id, () => `${source.value}:${selected.value}`, (_role, signal) => source.value === 'photo' && selected.value ? photo(props.student.id, selected.value, signal) : Promise.resolve(null));
watch(review.data, value => { gradeId.value = value?.question.grades.at(-1)?.id ?? ''; });
const selectedGrade = computed(() => review.data.value?.question.grades.find(grade => grade.id === gradeId.value));
const handwritingRows = computed(() => source.value === 'handwriting' ? list.data.value?.rows as ManuscriptRow[] : []);
const photoRows = computed(() => source.value === 'photo' ? list.data.value?.rows as PhotoRow[] : []);
const imageErrors = ref<Record<string, boolean>>({});
watch(gradeId, () => { imageErrors.value = {}; });
</script>
<template>
  <section v-if="list.authorized.value" class="history-section">
    <h3>原稿与批改历史</h3>
    <label>记录类型 <select v-model="source" aria-label="作业记录类型"><option value="handwriting">手写作业</option><option value="photo">单元拍照答案</option></select></label>
    <p v-if="list.loading.value" role="status">正在读取作业摘要…</p>
    <NAlert v-else-if="list.error.value" type="error" title="作业记录读取失败"><p>{{ list.error.value }}</p><NButton data-testid="retry-work" @click="list.reload">重试读取作业</NButton></NAlert>
    <template v-else-if="list.data.value">
      <p v-if="!list.data.value.rows.length">尚无作业记录</p>
      <article v-for="row in handwritingRows" :key="row.key"><strong>{{ row.title || '未命名作业' }}</strong><p>{{ row.unitId }} · {{ row.pages }} 页 · {{ formatBeijing(row.updatedAt) }}</p><NButton data-testid="open-handwriting" :aria-expanded="selected === row.key" @click="selected = selected === row.key ? '' : row.key">{{ selected === row.key ? '收起原稿' : '查看原稿与点评' }}</NButton></article>
      <article v-for="row in photoRows" :key="row.id"><strong>{{ row.number }}. {{ row.title }}</strong><p>{{ row.unitId }} · {{ row.gradeCount }} 次批改 · {{ formatBeijing(row.latestAt) }}</p><NButton data-testid="open-photo" :aria-expanded="selected === row.id" @click="selected = selected === row.id ? '' : row.id">{{ selected === row.id ? '收起答案' : '查看答案记录' }}</NButton></article>
      <nav aria-label="作业记录分页"><NButton :disabled="page <= 1" @click="page--">上一页</NButton><span>第 {{ page }} 页 · 共 {{ list.data.value.total }} 份</span><NButton data-testid="work-next" :disabled="page * list.data.value.pageSize >= list.data.value.total" @click="page++">下一页</NButton></nav>
    </template>
    <p v-if="hand.loading.value || review.loading.value" role="status">正在读取所选原稿…</p>
    <NAlert v-if="hand.error.value || review.error.value" type="error" title="原稿读取失败"><p>{{ hand.error.value || review.error.value }}</p><NButton @click="source === 'handwriting' ? hand.reload() : review.reload()">重试原稿</NButton></NAlert>
    <div v-if="hand.data.value" class="history-detail" data-testid="manuscript-detail">
      <h4>当前保存的手写原稿</h4><p class="prose">{{ hand.data.value.original.prompt }}</p>
      <p>当前原稿版本 {{ hand.data.value.original.revision }}；未保存旧版本笔迹快照，历史点评不代表可复原旧原稿。手写评分不直接计入排行榜。</p>
      <OriginalCanvas v-for="(strokes, i) in hand.data.value.original.pages" :key="`${selected}:${i}`" :strokes="strokes" :photo="hand.data.value.original.photos?.[i]" :page="i + 1" />
      <details v-if="hand.data.value.original.recognition"><summary>核对文字{{ hand.data.value.original.recognition.confirmed ? '（学生已确认）' : '（尚未确认）' }}</summary><p class="prose">{{ hand.data.value.original.recognition.text }}</p></details>
      <h4>全部点评记录</h4><p v-if="!hand.data.value.original.grades.length">尚无点评</p>
      <article v-for="(grade, i) in [...hand.data.value.original.grades].reverse()" :key="i"><strong>{{ grade.revision === hand.data.value.original.revision ? '当前原稿点评' : '历史点评（原稿已修改）' }} · {{ grade.needsReview ? '需要复核 / 无分数' : `${grade.score} / 100` }}</strong><p>版本 {{ grade.revision }} · {{ formatBeijing(grade.at) }}</p><p class="prose">{{ grade.feedback }}</p><ul v-if="grade.corrections?.length"><li v-for="(correction, n) in grade.corrections" :key="n">{{ correction.location }}：{{ correction.issue }}；订正：{{ correction.correction }}</li></ul><details v-if="grade.knowledge?.length"><summary>考核知识点</summary><p v-for="item in grade.knowledge" :key="item.nodeId">{{ item.nodeId }} · {{ item.score == null ? '待核对' : item.score + '/100' }} · {{ item.feedback }}</p></details></article>
    </div>
    <div v-if="review.data.value" class="history-detail" data-testid="photo-detail">
      <h4>{{ review.data.value.question.number }}. {{ review.data.value.question.text }}</h4>
      <label>批改记录 <select v-model="gradeId" aria-label="批改记录"><option v-for="(grade, i) in review.data.value.question.grades" :key="grade.id" :value="grade.id">第 {{ i + 1 }} 次 · {{ formatBeijing(grade.at) }} · {{ verdictLabel(grade.result.verdict) }}</option></select></label>
      <p v-if="!selectedGrade">尚无批改记录</p>
      <template v-else><p>版本 {{ selectedGrade.revision }} · {{ formatBeijing(selectedGrade.at) }} · {{ verdictLabel(selectedGrade.result.verdict) }}</p>
        <p v-if="!selectedGrade.result.answerPages?.length">此记录未保存作答图片</p>
        <figure v-for="(image, i) in selectedGrade.result.answerPages" :key="`${selectedGrade.id}:${i}`"><div class="answer-page"><img v-if="!imageErrors[String(i)]" :src="image" :alt="`所选批改第 ${i + 1} 页作答`" @error="imageErrors[String(i)] = true" /><p v-else role="alert">此页作答图片无法加载</p><template v-for="(annotation, n) in selectedGrade.result.answerAnnotations" :key="n"><span v-if="annotation.page === i + 1" class="annotation" :title="annotation.comment" :style="{ left: `${annotation.x * 100}%`, top: `${annotation.y * 100}%`, width: `${annotation.width * 100}%`, height: `${annotation.height * 100}%` }" /></template></div><figcaption>第 {{ i + 1 }} 页 · {{ formatBeijing(selectedGrade.at) }}</figcaption></figure>
        <p class="prose">{{ selectedGrade.studentAnswer }}</p><p class="prose">{{ selectedGrade.result.feedback }}</p><ul><li v-for="(item, i) in selectedGrade.result.corrections" :key="i">{{ item.location }}：{{ item.issue }}；订正：{{ item.correction }}</li><li v-for="(item, i) in selectedGrade.result.answerAnnotations" :key="`a${i}`">第 {{ item.page }} 页：{{ item.comment }}</li></ul>
        <details v-if="review.data.value.followups.some(item => item.gradeId === gradeId)"><summary>此记录的已保存追问</summary><article v-for="item in review.data.value.followups.filter(item => item.gradeId === gradeId)" :key="item.id"><p>{{ formatBeijing(item.at) }} · {{ item.prompt }}</p><p class="prose">{{ item.reply }}</p></article></details>
      </template>
    </div>
  </section>
</template>
<style scoped>
.history-section, .history-detail { display: grid; gap: 16px; min-width: 0; } h3, h4, p { margin: 0; } article { padding: 12px 0; border-bottom: 1px solid #e0e7e1; } article p { margin: 8px 0; } nav { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; } select { max-width: 100%; padding: 6px; border: 1px solid #b9c9bf; border-radius: 5px; background: white; color: #203c2e; } .prose { white-space: pre-wrap; overflow-wrap: anywhere; } figure { margin: 0; max-width: 800px; } .answer-page { position: relative; } img { width: 100%; height: auto; display: block; } .annotation { position: absolute; border: 2px solid #b42318; pointer-events: none; } figcaption { color: #617268; margin-top: 6px; }
</style>
