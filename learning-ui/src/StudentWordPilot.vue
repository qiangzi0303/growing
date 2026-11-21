<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
const props=defineProps({controller:{type:Object,required:true}});
const m=shallowRef(props.controller.model),a=props.controller.actions,panel=ref(null);
const unsubscribe=props.controller.subscribe(value=>m.value=value);
const session=computed(()=>m.value.state.session);
const finished=computed(()=>!!session.value?.finishedAt);
const cardView=computed(()=>m.value.view==='card'||m.value.step?.kind==='intro'&&!finished.value);
const artWord=computed(()=>m.value.view==='home'?m.value.words[0]:cardView.value?m.value.word:null);
const remaining=computed(()=>m.value.plan.due.length+m.value.plan.fresh.length);
const canNext=computed(()=>m.value.view==='session'&&!finished.value&&(m.value.step?.kind==='intro'||session.value?.feedback));
const cloze=computed(()=>{
 const v=m.value,w=v.word,s=v.state.session;
 const previousReviews=(v.state.cards[w.id]?.reviews||0)-(s?.mode==='learn'&&s.answers[w.id]?1:0);
 return previousReviews>0||v.step?.retry?w.reviewCloze:w.cloze;
});
const kindLabel={meaning:'看词选义',cloze:'补全句子',listen:'听音辨词',spell:'看义拼写'};
const dateLabel=value=>new Date(value).toLocaleString('zh-CN',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
const status=w=>m.value.plan.fresh.includes(w.id)?'待学':m.value.plan.due.includes(w.id)?'待复习':'已安排复习';
let lastNext=-Infinity;
function advance(event){
 if(event?.repeat||event?.detail>1||performance.now()-lastNext<250)return;
 lastNext=performance.now();a.next();
}
function keyboard(event){
 if(event.isComposing||event.keyCode===229||event.altKey||event.ctrlKey||event.metaKey)return;
 if(!['Enter',' '].includes(event.key))return;
 if(event.repeat){event.preventDefault();return;}
 if(event.target.closest('button,a,input,textarea,select,[contenteditable=true]'))return;
 if(canNext.value){event.preventDefault();advance(event);}
}
function reload(){if(!m.value.unsaved||window.confirm('重新读取将放弃此页尚未保存的修改，使用已保存记录。是否继续？'))a.reload();}
function beforeUnload(event){if(m.value.unsaved){event.preventDefault();event.returnValue='';}}
window.addEventListener('beforeunload',beforeUnload);
onBeforeUnmount(()=>{unsubscribe();window.removeEventListener('beforeunload',beforeUnload);});
watch([()=>m.value.view,()=>session.value?.index,()=>!!session.value?.feedback,finished],async()=>{
 await nextTick();panel.value?.focus({preventScroll:true});panel.value?.scrollIntoView({block:'start'});
});
</script>

<template>
 <section ref="panel" class="word-pilot" tabindex="-1" aria-label="Unit 1 十词试学" @keydown="keyboard">
  <header class="pilot-heading"><div><p class="pilot-kicker">UNIT 1 · FRIENDSHIP</p><h2>10词试学</h2></div><button v-if="m.view!=='home'" type="button" class="pilot-text-button" @click="a.home">返回概览</button></header>
  <div v-if="m.error||m.unsaved" class="pilot-alert" role="alert"><p>{{ m.error||m.notice }}</p><div class="pilot-actions"><button v-if="m.unsaved" type="button" @click="a.retrySave">重试保存</button><button type="button" @click="reload">重新读取记录</button></div></div>
  <p v-else-if="m.notice" role="status">{{ m.notice }}</p>

  <template v-if="m.view==='home'">
   <div class="pilot-welcome"><div><h3>把词放进场景里，<br>再试着想起来。</h3><p>每组先认识 5 个词，再交错回忆。答错的词，会换个提示再次出现。</p><div class="pilot-counts"><span><strong>{{ m.plan.fresh.length }}</strong> 个待学</span><span><strong>{{ m.plan.due.length }}</strong> 个待复习</span></div><button class="pilot-primary" type="button" :disabled="!!m.error||m.unsaved||!m.resumable&&!remaining" @click="a.start()">{{ m.resumable?'继续上次练习':remaining?'开始今日练习':'今日练习已完成' }}</button><p v-if="m.plan.nextDue" class="pilot-muted">下次复习：{{ dateLabel(m.plan.nextDue) }}</p></div><img :src="m.words[0].art" :alt="m.words[0].scene" width="480" height="320"></div>
   <p v-if="finished" class="pilot-last-result">上一轮{{ session.mode==='practice'?'额外练习':'' }}：首次独立答对 <strong>{{ m.summary.correct }}/{{ m.summary.total }}</strong>，其中 {{ m.summary.hinted }} 词使用过提示。</p>
   <div class="pilot-section-heading"><h3>这次认识的 10 个词</h3><button v-if="!m.resumable&&!m.plan.fresh.length" type="button" class="pilot-text-button" :disabled="!!m.error||m.unsaved" @click="a.start(true)">额外练一轮</button></div>
   <div class="pilot-word-list"><button v-for="w in m.words" :key="w.id" type="button" @click="a.card(w.id)"><span lang="en">{{ w.word }}</span><small>{{ status(w) }}</small></button></div>
   <p class="pilot-note">独立答对后，复习间隔依次为 1、3、7 天；答错或用了提示，次日再练。额外练习不改变复习日期。试学单独记录，不计入正式默写成绩。</p>
  </template>

  <template v-else-if="m.view==='session'&&finished">
   <div class="pilot-result"><p class="pilot-kicker">{{ session.mode==='practice'?'额外练习完成':'本轮完成' }}</p><h3>第一次，自己想起来了</h3><p class="pilot-score"><strong>{{ m.summary.correct }}</strong><span>/ {{ m.summary.total }} 词</span></p><p>使用提示 {{ m.summary.hinted }} 词 · 待巩固 {{ m.summary.wrong.length }} 词</p><p class="pilot-muted">按每个词的首次作答统计，重试答对不会改写首答。</p><div v-if="m.summary.wrong.length" class="pilot-review-list"><button v-for="id in m.summary.wrong" :key="id" type="button" @click="a.card(id)">{{ m.words.find(w=>w.id===id).word }} · 回看词卡</button></div><p v-if="m.plan.nextDue">下次复习：{{ dateLabel(m.plan.nextDue) }}</p><div class="pilot-actions"><button type="button" class="pilot-primary" @click="a.home">返回学习概览</button><a href="english-sentence-demo.html?unit=english-8a-01">去句子闯关 →</a></div></div>
  </template>

  <template v-else-if="cardView">
   <p v-if="m.view==='session'" class="pilot-muted">认识词语 · 第 {{ Math.floor(m.words.indexOf(m.word)/5)+1 }} 组 / 2 组</p>
   <article class="pilot-word-card"><figure><img :src="m.word.art" :alt="m.word.scene" width="480" height="320"><figcaption>{{ m.word.scene }}</figcaption></figure><div><h3 class="pilot-word" lang="en">{{ m.word.word }}</h3><p class="pilot-phonetic" lang="en">{{ m.word.ipa }} <button type="button" @click="a.speak">听发音</button></p><p class="pilot-meaning"><span lang="en">{{ m.word.pos }}</span> {{ m.word.meaning }}</p><blockquote><p lang="en">{{ m.word.example }}</p><p class="pilot-muted">{{ m.word.translation }}</p></blockquote><p class="pilot-collocation">{{ m.word.collocation }}</p><p class="pilot-muted">{{ m.word.tip }}</p></div></article>
   <div class="pilot-actions"><button v-if="m.view==='session'" type="button" class="pilot-primary" :disabled="m.unsaved||!!m.error" @click="advance">{{ session.steps[session.index+1]?.kind==='intro'?'认识下一个词':'收起词卡，开始回忆' }}</button><button v-else type="button" @click="a.home">返回词卡目录</button><span v-if="m.view==='session'" class="pilot-muted">回车 / 空格继续</span></div>
  </template>

  <template v-else-if="m.view==='session'&&m.step">
   <div class="pilot-progress"><span>{{ kindLabel[m.step.kind] }}{{ m.step.retry?' · 再试一次':'' }}</span><span>已回忆 {{ m.summary.total }} / {{ new Set(session.steps.filter(s=>s.kind!=='intro').map(s=>s.wordId)).size }} 词</span></div>
   <div class="pilot-question" :data-kind="m.step.kind">
    <template v-if="m.step.kind==='meaning'"><p class="pilot-muted">选出这个词在本单元的意思</p><h3 lang="en">{{ m.word.word }}</h3></template>
    <template v-else-if="m.step.kind==='listen'"><h3>你听到了哪个词？</h3><button type="button" class="pilot-listen" @click="a.speak">▶ 播放单词</button><p class="pilot-muted">可以重复播放，再选出你听到的单词。</p></template>
    <template v-else-if="m.step.kind==='cloze'"><p class="pilot-muted">用这轮学过的词补全句子</p><h3 class="pilot-cloze" lang="en">{{ cloze }}</h3></template>
    <template v-else><p class="pilot-muted">想一想，英文怎么写？</p><h3>{{ m.word.meaning }}</h3><p lang="en">{{ m.word.pos }}</p></template>
    <div v-if="m.options.length" class="pilot-options"><button v-for="(option,i) in m.options" :key="option.id" type="button" :disabled="!!session.feedback||m.unsaved||!!m.error" :class="{'pilot-correct':session.feedback&&option.id===m.word.id,'pilot-incorrect':session.feedback&&!session.feedback.correct&&session.draft===option.word}" @click="a.answer(option.word)"><span class="pilot-option-number">{{ String.fromCharCode(65+i) }}</span><span>{{ m.step.kind==='meaning'?option.meaning:option.word }}</span></button></div>
    <form v-else @submit.prevent="a.answer()"><label for="pilot-answer">填写英文单词</label><input id="pilot-answer" :value="session.draft" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" :spellcheck="false" enterkeyhint="done" maxlength="80" :readonly="!!session.feedback" :disabled="!!m.error" @input="a.input($event.target.value)" @keydown.enter="($event.isComposing||$event.repeat)&&$event.preventDefault()"><button v-if="!session.feedback" type="submit" class="pilot-primary" :disabled="!session.draft.trim()||m.unsaved||!!m.error">确认答案</button></form>
    <button v-if="!session.feedback&&!session.hinted" type="button" class="pilot-text-button pilot-hint-button" :disabled="m.unsaved||!!m.error" @click="a.hint">想不起来，看看提示</button>
    <p v-if="session.hinted&&!session.feedback" class="pilot-hint" role="status"><strong>{{ m.word.word }}</strong> · {{ m.word.meaning }}<br>{{ m.word.collocation }}<br><small>这次将记为使用提示，稍后换个提示再练。</small></p>
    <div v-if="session.feedback" class="pilot-feedback" :class="{'pilot-feedback-wrong':!session.feedback.correct}" role="status"><strong>{{ session.feedback.correct?(session.hinted?'借助提示想起来了':'答对了'):'再看清这个词' }}</strong><p><b lang="en">{{ m.word.word }}</b> · {{ m.word.meaning }}</p><p lang="en">{{ m.word.example }}</p><p class="pilot-muted">{{ m.word.translation }}</p><div class="pilot-actions"><button type="button" class="pilot-primary" :disabled="m.unsaved||!!m.error" @click="advance">{{ session.index===session.steps.length-1?'查看本轮结果':'下一题' }}</button><button type="button" @click="a.speak">再听一次</button><span class="pilot-muted">回车 / 空格继续</span></div></div>
   </div>
  </template>
  <p v-if="artWord?.artSource" class="pilot-art-credit">插画：<a :href="artWord.artSource" target="_blank" rel="noopener noreferrer">词光 · Word Atlas contributors</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · 原图未修改</p>
 </section>
</template>

<style scoped>
.pilot-art-credit{margin:18px 0 0;font-size:12px;line-height:1.7;color:#596b60}.pilot-art-credit a{color:inherit;text-decoration:underline;text-underline-offset:3px}
.word-pilot{max-width:960px;margin:auto;scroll-margin-top:20px;color:#24352e;outline:none}.word-pilot *{box-sizing:border-box}.word-pilot button{font:inherit;color:inherit;background:white;border:1px solid #b9c6b9;border-radius:8px;min-height:44px;padding:10px 16px;cursor:pointer;line-height:1.5}.word-pilot button:disabled{opacity:.55;cursor:default}.word-pilot button:focus-visible,.word-pilot input:focus-visible,.word-pilot a:focus-visible{outline:3px solid #327958;outline-offset:3px}.word-pilot button.pilot-primary{background:#22634b;border-color:#22634b;color:white;font-weight:600}.word-pilot button.pilot-text-button{background:transparent;border-color:transparent;color:#22634b;text-decoration:underline;text-underline-offset:4px}.pilot-heading,.pilot-section-heading,.pilot-progress{display:flex;align-items:center;justify-content:space-between;gap:12px}.pilot-heading{margin-bottom:24px}.word-pilot .pilot-kicker{font-size:12px;letter-spacing:.08em;color:#536a5c;margin:0 0 6px}.word-pilot .pilot-heading h2{font-size:28px;margin:0}.pilot-welcome{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:32px;padding:28px;border-radius:16px;background:#eef4ed}.pilot-welcome h3{font-size:28px;line-height:1.4;margin:0}.word-pilot img{display:block;width:100%;height:auto;border-radius:12px}.pilot-welcome p{margin:16px 0}.pilot-counts{display:flex;gap:24px;margin:20px 0}.pilot-counts strong{font-size:26px;margin-right:4px}.pilot-muted,.pilot-note{color:#596b60;font-size:14px}.pilot-last-result{padding:12px 0;border-bottom:1px solid #dbe4d8}.pilot-section-heading{margin-top:26px}.pilot-section-heading h3{font-size:18px}.pilot-word-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pilot-word-list button{display:flex;justify-content:space-between;align-items:center;gap:8px;text-align:left;padding:15px;background:#fff}.pilot-word-list span{font-size:18px;font-weight:600;overflow-wrap:anywhere}.pilot-word-list small{color:#637366;font-size:12px;flex-shrink:0}.pilot-note{margin-top:22px;line-height:1.8}.pilot-word-card{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:32px;background:#fff;border:1px solid #dbe4d8;border-radius:14px;padding:24px}.pilot-word-card figure{margin:0}.pilot-word-card figcaption{font-size:14px;line-height:1.7;color:#596b60;margin-top:12px}.word-pilot .pilot-word{font-size:36px;margin:0 0 8px;overflow-wrap:anywhere}.pilot-phonetic{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.pilot-meaning{font-size:19px}.pilot-word-card blockquote{margin:20px 0;border-left:3px solid #8cad91;padding-left:16px}.pilot-word-card blockquote p{margin:4px 0}.pilot-collocation{font-weight:600}.pilot-actions{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:20px}.pilot-actions a{font-size:15px}.pilot-progress{font-size:14px;color:#596b60;margin:16px 0}.pilot-question{padding:28px;background:white;border:1px solid #dbe4d8;border-radius:14px}.pilot-question h3{font-size:30px;margin:16px 0;line-height:1.5;overflow-wrap:anywhere}.pilot-question h3.pilot-cloze{font-size:24px}.pilot-options{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0}.pilot-options button{display:flex;align-items:center;gap:14px;text-align:left;min-height:60px}.pilot-option-number{font-size:13px;color:#637366}.word-pilot .pilot-options .pilot-correct{opacity:1;border-color:#327958;background:#edf7ee}.word-pilot .pilot-options .pilot-incorrect{opacity:1;border-color:#b45a40;background:#fff1e8}.pilot-question form{display:flex;flex-direction:column;align-items:flex-start;gap:12px;margin-top:24px}.pilot-question input{font:inherit;font-size:22px;border:1px solid #8b9f8e;border-radius:8px;padding:12px;min-height:50px;width:100%;color:#24352e;background:#fff;box-shadow:none}.pilot-question input[readonly]{background:#f5f7f3}.pilot-hint-button{margin-top:16px}.pilot-hint,.pilot-feedback{padding:18px;background:#eff6ee;border-radius:10px;margin-top:20px;overflow-wrap:anywhere}.pilot-feedback-wrong{background:#fff3e8}.pilot-feedback p{margin:8px 0}.pilot-alert{padding:16px;background:#fff2e3;border:1px solid #d4a678;border-radius:10px;margin:16px 0;overflow-wrap:anywhere}.pilot-alert p{margin:0}.pilot-result{background:white;border:1px solid #dbe4d8;border-radius:14px;padding:32px}.pilot-result h3{font-size:24px}.word-pilot .pilot-score{display:flex;align-items:baseline;gap:12px;margin:20px 0;line-height:1}.pilot-score strong{font-size:72px;font-weight:600;color:#22634b}.pilot-score span{font-size:22px;color:#596b60}.pilot-review-list{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}.pilot-listen{margin:10px 0}
@media(max-width:650px){.pilot-heading{margin-bottom:18px}.pilot-welcome{grid-template-columns:1fr;padding:20px;gap:18px}.pilot-welcome img{max-width:340px;justify-self:center;grid-row:1}.pilot-welcome h3{font-size:24px}.pilot-word-card{grid-template-columns:1fr;padding:18px;gap:24px}.pilot-word-card img{max-height:230px;object-fit:contain}.pilot-word-card figcaption{margin-top:8px}.word-pilot .pilot-word{font-size:32px}.pilot-options{grid-template-columns:1fr;gap:10px}.pilot-question,.pilot-result{padding:18px}.pilot-word-list{grid-template-columns:1fr}.pilot-question h3.pilot-cloze{font-size:22px}.pilot-actions>button.pilot-primary{flex:1}.pilot-progress{font-size:12px}.pilot-section-heading{flex-wrap:wrap;gap:0}.pilot-question h3{font-size:26px}}
</style>
