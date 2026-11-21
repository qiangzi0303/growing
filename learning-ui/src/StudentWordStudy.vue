<script setup>
import {computed,nextTick,ref,watch} from 'vue';
import StudentWordArtwork from './StudentWordArtwork.vue';
const props=defineProps({model:{type:Object,required:true},actions:{type:Object,required:true}});
const m=computed(()=>props.model),a=props.actions,panel=ref(null),answerInput=ref(null);
const card=computed(()=>m.value.studyCards?.[m.value.word.id]);
const session=computed(()=>m.value.reviewSession);
const resumable=computed(()=>session.value&&!session.value.finished);
const blocked=computed(()=>m.value.reviewUnsaved||!!m.value.reviewError);
const due=computed(()=>new Set(m.value.reviewPlan?.dueIds||[]));
const date=value=>value?new Date(value+'T12:00:00').toLocaleDateString('zh-CN',{month:'long',day:'numeric'}):'';
const filtered=computed(()=>{
 const term=m.value.query.trim().toLowerCase(),filter=m.value.filter;
 return m.value.words.filter(w=>(!term||w.word.toLowerCase().includes(term)||w.meaning.includes(term))&&(
  filter==='all'||filter==='due'&&due.value.has(w.id)||filter==='optional'&&w.optional||filter==='required'&&!w.optional||filter==='mastered'&&m.value.wordPassed[w.id]||filter==='pending'&&!w.optional&&!m.value.wordPassed[w.id]
 ));
});
function reload(){if(!m.value.reviewUnsaved||window.confirm('重新读取将使用已保存记录，放弃本页尚未保存的修改。是否继续？'))a.reloadReview();}
watch([()=>m.value.view,()=>m.value.word.id,()=>session.value?.index,()=>!!session.value?.feedback],async()=>{
 await nextTick();
 if(m.value.view==='review'&&!session.value?.finished&&!session.value?.feedback)answerInput.value?.focus({preventScroll:true});
 else panel.value?.focus({preventScroll:true});
 panel.value?.scrollIntoView({block:'start'});
});
</script>

<template>
 <section ref="panel" class="word-study" tabindex="-1" aria-label="单词学习">
  <div v-if="m.reviewError||m.reviewUnsaved" class="study-alert" role="alert">
   <p>{{ m.reviewError||'本次答案尚未保存，请重试保存后继续。' }}</p>
   <div class="study-actions"><button v-if="m.reviewUnsaved" type="button" data-action="retry-save" @click="a.retryReviewSave()">重试保存</button><button type="button" @click="reload">重新读取记录</button></div>
  </div>

  <template v-if="m.view==='words'">
   <header class="study-overview">
    <div><h2>今天，从记住一个词开始</h2><p>先复习到期单词，再学习新词。独立默写正确后，复习间隔逐步延长；答错或看过提示的词，明天再练。</p></div>
    <div class="study-actions">
     <button type="button" class="study-primary" data-action="review-due" :disabled="blocked||!resumable&&!due.size" @click="a.startReview()">{{ resumable?'继续上次复习':due.size?'复习到期词 · '+due.size:'今天暂无到期词' }}</button>
     <button type="button" :disabled="blocked||!m.reviewPlan?.freshIds.length" @click="a.startLearning">学习新词{{ m.reviewPlan?.freshIds.length?' · '+m.reviewPlan.freshIds.length:'' }}</button>
    </div>
    <p v-if="m.reviewPlan?.nextDue" class="study-muted">下一次复习：{{ date(m.reviewPlan.nextDue) }}</p>
   </header>
   <div class="study-library-heading"><h2>本单元词表 <span>{{ m.words.length }} 词</span></h2><p class="study-muted">{{ m.passed||0 }} 词默写达标</p></div>
   <div class="study-tools">
    <label><span class="study-sr-only">搜索词条或释义</span><input type="search" :value="m.query" placeholder="搜索英文或中文" @input="a.query($event.target.value)"></label>
    <label><span class="study-sr-only">筛选词条</span><select :value="m.filter" @change="a.filter($event.target.value)"><option value="all">全部词条</option><option value="due">今天复习</option><option value="required">必会词条</option><option value="pending">待掌握</option><option value="mastered">默写已达标</option><option value="optional">选学词条</option></select></label>
   </div>
   <div class="study-word-grid">
    <button v-for="w in filtered" :key="w.id" type="button" class="study-word-row" :class="w.optional?'study-word-optional':m.wordPassed[w.id]?'study-word-mastered':'study-word-pending'" :data-study-word="w.id" @click="a.word(w.id)">
     <img v-if="m.studyCards?.[w.id]?.art" :src="m.studyCards[w.id].art" alt="" loading="lazy" width="68" height="68">
     <span class="study-word-copy"><strong lang="en">{{ w.word }}</strong><span>{{ w.meaning }}</span><small :class="{'study-due':due.has(w.id)}">{{ w.optional?'选学':m.wordPassed[w.id]?'✓ 已掌握':'待掌握' }}<template v-if="m.reviewStatus?.[w.id]?.due"> · {{ m.reviewStatus[w.id].label }}</template></small></span>
    </button>
   </div>
   <p v-if="!filtered.length" class="study-muted">没有符合条件的词条，请调整搜索或筛选。</p>
  </template>

  <template v-else-if="m.view==='word'">
   <div class="study-topline"><button type="button" class="study-text-button" @click="a.navigate('words')">← 返回词表</button><span class="study-muted">{{ m.word.optional?'选学词条':m.wordFullyPassed?'拼写、词义与词类均已掌握':m.wordPassed[m.word.id]?'历史默写已达标':'必会词条' }}</span></div>
   <article class="study-word-detail" :class="{'study-meaning-hidden':m.hideWordMeaning}">
    <StudentWordArtwork v-if="!m.hideWordMeaning" :card="card"/>
    <div class="study-word-content">
     <h2 class="study-headword" lang="en">{{ m.word.word }}</h2>
     <div class="study-pronunciation"><span v-if="card?.ipa" lang="en">{{ card.ipa }}</span><button type="button" @click="a.speak(false)">听发音</button></div>
     <p v-if="m.hideWordMeaning" class="study-muted">七次默写已完成，词义和插画已收起，请继续验证词义与词类。</p>
     <template v-else>
      <p class="study-meaning">{{ m.word.meaning }}</p>
      <p v-if="m.description?.plurals.length" class="study-muted">复数：{{ m.description.plurals.join(' / ') }}</p>
      <blockquote v-if="card?.example"><p lang="en">{{ card.example }}</p><p class="study-muted">{{ card.translation }}</p></blockquote>
      <p v-if="card?.collocation" class="study-collocation">{{ card.collocation }}</p>
     </template>
     <p v-if="m.reviewStatus?.[m.word.id]?.due" class="study-muted">下次复习：{{ date(m.reviewStatus[m.word.id].due) }}</p>
     <div class="study-actions"><button type="button" class="study-primary" data-action="formal-recall" :disabled="blocked" @click="a.recall()">{{ m.state.words[m.word.id]?.practice?'继续本词验证':'开始闭卷默写 · 7次' }}</button></div>
    </div>
   </article>
  </template>

  <template v-else-if="m.view==='review'&&session">
   <div class="study-topline"><h2>单词复习</h2><button type="button" class="study-text-button" @click="a.navigate('words')">返回词表</button></div>
   <article v-if="session.finished" class="study-review-finished">
    <h3>这轮复习完成了</h3>
    <p v-if="m.reviewSummary" class="study-result">首次独立答对 <strong>{{ m.reviewSummary.correct }} / {{ m.reviewSummary.total }}</strong> 词</p>
    <p v-if="m.reviewSummary?.hinted">其中 {{ m.reviewSummary.hinted }} 词使用过提示。</p>
    <p class="study-muted">每个词的下次复习已按首答表现安排，当天订正不提前延长间隔。</p>
    <div v-if="m.reviewSummary?.wrongIds.length" class="study-actions"><button v-for="id in m.reviewSummary.wrongIds" :key="id" type="button" @click="a.word(id)">{{ m.words.find(w=>w.id===id)?.word }} · 回看词卡</button></div>
    <div class="study-actions"><button type="button" class="study-primary" @click="a.navigate('words')">返回词表</button><button v-if="m.reviewPlan?.freshIds.length" type="button" @click="a.startLearning">继续学新词</button></div>
   </article>
   <article v-else class="study-review-question">
    <p class="study-muted">第 {{ session.index+1 }} / {{ session.ids.length }} 题 · 看义默写</p>
    <h3>{{ m.word.meaning }}</h3>
    <form @submit.prevent="a.submitReview()">
     <label for="study-review-answer">填写英文单词或短语</label>
     <input id="study-review-answer" ref="answerInput" :value="session.draft" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" :spellcheck="false" enterkeyhint="done" maxlength="140" :readonly="!!session.feedback" :disabled="!!m.reviewError&&!m.reviewUnsaved" @input="a.reviewInput($event.target.value)" @keydown.enter="($event.isComposing||$event.repeat)&&$event.preventDefault()">
     <div v-if="!session.feedback" class="study-actions"><button type="submit" class="study-primary" :disabled="!session.draft.trim()||blocked">提交默写</button></div>
    </form>
    <div v-if="session.feedback" class="study-feedback" :class="{'study-feedback-wrong':!session.feedback.correct}" role="status">
     <h4>{{ session.feedback.correct?(session.feedback.hinted?'借助提示完成了':'答对了'):'再看清这个词' }}</h4>
     <p class="study-feedback-word" lang="en">{{ m.word.word }}</p>
     <p v-if="m.reviewStatus?.[m.word.id]?.due" class="study-muted">下次复习：{{ date(m.reviewStatus[m.word.id].due) }}{{ session.feedback.retry?' · 本次为订正':'' }}</p>
     <div class="study-feedback-card"><StudentWordArtwork :card="card"/><div><p v-if="card?.example" lang="en">{{ card.example }}</p><p class="study-muted">{{ card?.translation }}</p><button type="button" @click="a.speak(false)">再听一次</button></div></div>
     <div class="study-actions"><button type="button" class="study-primary" data-action="review-next" :disabled="blocked" @click="a.reviewNext()">{{ session.index+1<session.ids.length?'下一词':'查看本轮结果' }}</button></div>
    </div>
   </article>
  </template>
 </section>
</template>

<style scoped>
.word-study{color:var(--ui-ink,#24352e);outline:none;scroll-margin-top:16px}.word-study *{box-sizing:border-box}.word-study button,.word-study input,.word-study select{font:inherit}.word-study button{min-height:44px;padding:10px 16px;background:#fff;border:1px solid #b9c6b9;border-radius:8px;color:inherit;cursor:pointer;line-height:1.5}.word-study button:disabled{opacity:.55;cursor:default}.word-study button.study-primary{background:#22634b;border-color:#22634b;color:#fff;font-weight:600}.word-study button.study-text-button{background:transparent;border-color:transparent;color:#22634b;text-decoration:underline;text-underline-offset:3px}.word-study button:focus-visible,.word-study input:focus-visible,.word-study select:focus-visible{outline:3px solid #327958;outline-offset:3px}.word-study h2{font-size:24px;margin:0}.study-muted{font-size:14px;color:#596b60;line-height:1.7}.study-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:18px}.study-overview{padding:24px 0 26px;border-bottom:1px solid #dbe4d8}.study-overview>div:first-child{max-width:680px}.study-overview p{font-size:15px;line-height:1.8;margin:12px 0 0}.study-library-heading,.study-topline{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin:24px 0 16px}.study-library-heading h2{font-size:19px}.study-library-heading h2 span{font-weight:400;font-size:14px;color:#596b60;margin-left:8px}.study-library-heading p{margin:0}.study-tools{display:flex;gap:12px;margin:16px 0}.study-tools label:first-child{flex:1;max-width:360px}.study-tools input,.study-tools select{width:100%;min-height:44px;border:1px solid #b9c6b9;border-radius:8px;padding:10px 12px;background:#fff;color:inherit}.study-word-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.word-study .study-word-row{display:flex;align-items:center;gap:14px;padding:16px;text-align:left;min-width:0;border-color:#dbe4d8}.study-word-row img{width:68px;height:68px;object-fit:contain;border-radius:8px;flex-shrink:0}.study-word-copy{display:flex;flex-direction:column;gap:5px;min-width:0}.study-word-copy strong{font-size:18px;overflow-wrap:anywhere;line-height:1.35}.study-word-copy>span{font-size:13px;line-height:1.6;color:#53675c}.study-word-copy small{font-size:12px;color:#637366}.study-word-copy .study-due{color:#22634b;font-weight:600}.study-word-detail{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;gap:36px;background:#fff;border:1px solid #dbe4d8;border-radius:12px;padding:28px}.study-word-detail.study-meaning-hidden{display:block}.study-word-content{min-width:0}.word-study .study-headword{font-size:36px;line-height:1.25;overflow-wrap:anywhere;margin:0 0 16px}.study-pronunciation{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.study-meaning{font-size:20px;line-height:1.6}.study-word-content blockquote{margin:24px 0;border-left:3px solid #8cad91;padding-left:16px;line-height:1.7}.study-word-content blockquote p{margin:4px 0}.study-collocation{font-weight:600;line-height:1.7}.study-review-question,.study-review-finished{max-width:760px;margin:0 auto;border:1px solid #dbe4d8;border-radius:12px;background:#fff;padding:28px}.study-review-question h3{font-size:27px;line-height:1.5;margin:16px 0 24px}.study-review-question form{display:flex;flex-direction:column;gap:10px}.study-review-question input{width:100%;min-height:52px;font-size:22px;padding:12px;border:1px solid #8b9f8e;border-radius:8px;background:#fff;color:inherit}.study-review-question input[readonly]{background:#f5f7f3}.study-review-question form .study-actions{margin-top:6px}.study-hint,.study-feedback{background:#eff6ee;border-radius:10px;padding:20px;margin-top:24px}.study-feedback-wrong{background:#fff3e8}.study-feedback h4{font-size:18px;margin:0 0 12px}.study-feedback-word{font-size:28px;font-weight:600;overflow-wrap:anywhere;margin:12px 0}.study-feedback-card{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:center;margin-top:20px;line-height:1.7}.study-result strong{font-size:28px;color:#22634b;margin:0 4px}.study-review-finished h3{font-size:26px}.study-alert{padding:16px;background:#fff2e3;border:1px solid #d4a678;border-radius:10px;margin-bottom:18px}.study-alert p{margin:0;overflow-wrap:anywhere}.study-sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.word-study .study-word-mastered{background:#e4f1e3;border-color:#a3c69e}.word-study .study-word-pending{background:#fff3df;border-color:#e5c698}.study-word-mastered .study-word-copy small{color:#356631}.study-word-pending .study-word-copy small{color:#80551e}
@media(max-width:960px){.study-word-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.study-word-detail{gap:24px;padding:22px}}
@media(max-width:650px){.study-word-grid{grid-template-columns:1fr}.study-overview{padding:8px 0 22px}.word-study h2{font-size:22px}.study-word-detail{grid-template-columns:1fr;padding:18px;gap:24px}.word-study .study-headword{font-size:32px}.study-review-question,.study-review-finished{padding:18px}.study-feedback-card{grid-template-columns:1fr}.study-feedback{padding:16px}.study-tools{flex-wrap:wrap}.study-tools label:first-child{max-width:none;flex-basis:100%}.study-tools label:last-child{flex:1}.study-actions>button.study-primary{flex-grow:1}.study-library-heading{margin-top:24px}.study-topline{margin-top:8px}.study-review-question h3{font-size:24px}}
</style>
