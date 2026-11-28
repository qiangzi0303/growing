<script setup>
import {computed,nextTick,ref,watch} from 'vue';
import EnglishPomodoroMarker from './EnglishPomodoroMarker.vue';
import StudyStepTrack from './StudyStepTrack.vue';
import ActionFeedbackButton from './ActionFeedbackButton.vue';
const requestCancelled=ref(false);
const props=defineProps({model:{type:Object,required:true},actions:{type:Object,required:true},pomodoroTargets:{type:Array,default:()=>[]},pomodoroPaused:{type:Boolean,default:false}});
const wordTarget=computed(()=>props.pomodoroTargets.find(t=>t.kind==='word'&&t.wordId===props.model.word.id));
const m=computed(()=>props.model),a=props.actions,input=ref(null);
const blocked=computed(()=>m.value.reviewUnsaved||!!m.value.reviewError);
const savedRecalls=ref(0);
// Some course controllers retain an unsaved attempt in memory. Keep the last
// acknowledged count until retry succeeds, even if that in-memory run changes.
watch([()=>m.value.word.id,()=>blocked.value,()=>m.value.run?.answers.length],([id,unsaved,count],[previousId]=[])=>{
 if(id!==previousId)savedRecalls.value=0;
 if(!unsaved)savedRecalls.value=Math.max(0,Math.min(7,count||0));
},{immediate:true});
const oralPassed=computed(()=>m.value.run?.oral?.meaningPassed&&m.value.run.oral.posPassed&&!m.value.run.oral.errors.length);
const nextLabel=computed(()=>m.value.words.indexOf(m.value.word)<m.value.words.length-1?'下一个单词':'返回本单元');
function reload(){if(!m.value.reviewUnsaved||window.confirm('重新读取将使用已保存记录，放弃本页尚未保存的修改。是否继续？'))a.reloadReview();}
let submitting=false,composing=false;
async function focusInput(){await nextTick();input.value?.focus({preventScroll:true});}
async function submit(){
 if(submitting||composing||blocked.value||m.value.busy||!m.value.recallDraft?.trim())return;
 submitting=true;
 try{a.submitRecall();}finally{await focusInput();submitting=false;}
}
function keydown(event){
 if(!['Enter',' '].includes(event.key))return;
 if(event.isComposing||composing||(event.key===' '&&event.keyCode===229))return;
 if(event.repeat){event.preventDefault();return;}
 if(event.key===' '){
  const expected=m.value.stage==='plural'?m.value.description?.plurals?.[0]:m.value.word.word;
  const parts=String(expected||'').trim().split(/\s+/).length;
  const field=event.target;
  if(parts>1&&(field.value.trim().split(/\s+/).length<parts||field.selectionStart!==field.value.length||field.selectionEnd!==field.value.length))return;
 }
 event.preventDefault();submit();
}
function beforeinput(event){
 if(!['insertLineBreak','insertParagraph'].includes(event.inputType)||event.isComposing||composing)return;
 event.preventDefault();submit();
}
watch([()=>m.value.stage,()=>m.value.word.id,()=>blocked.value],focusInput,{immediate:true});
</script>
<template>
 <section v-if="m.run" class="formal-study student-english-panel" :data-stage="m.stage" aria-label="正式单词默写">
  <div v-if="blocked" class="formal-alert" role="alert"><p>{{ m.reviewError||'本次答案尚未保存，请重试保存后继续。' }}</p><div class="formal-actions"><button v-if="m.reviewUnsaved" type="button" @click="a.retryReviewSave()">重试保存</button><button type="button" @click="reload">重新读取记录</button></div></div>
  <template v-if="m.stage!=='oral'">
   <h2>{{ m.stage==='recall'?m.word.meaning:m.word.word }}<EnglishPomodoroMarker :target="wordTarget" :paused="pomodoroPaused"/></h2>
   <p v-if="m.stage!=='recall'">请默写这个词的复数形式。中文释义已隐藏。</p>
   <form @submit.prevent="submit">
    <div class="formal-progress"><label for="formal-answer">{{ m.stage==='recall'?'第 '+Math.min(savedRecalls+1,7)+'/7 次':'复数形式' }}</label><StudyStepTrack v-if="m.stage==='recall'" :key="m.word.id" :total="7" :completed="savedRecalls" :current="savedRecalls<7?savedRecalls:-1" :pending="blocked" label="连续正确默写"/></div>
    <input id="formal-answer" ref="input" data-formal-answer :value="m.recallDraft||''" :aria-label="m.stage==='recall'?'英文默写':'复数形式'" enterkeyhint="send" autocomplete="off" autocapitalize="off" autocorrect="off" :spellcheck="false" maxlength="140" required :disabled="blocked" @input="a.recallInput($event.target.value)" @keydown="keydown" @beforeinput="beforeinput" @compositionstart="composing=true" @compositionend="composing=false">
    <div class="formal-actions"><button class="formal-primary" type="submit" :disabled="blocked||!m.recallDraft?.trim()">{{ m.stage==='recall'?'提交默写':'确认复数' }}</button></div>
   </form>
  </template>
  <template v-else>
   <h2 lang="en">{{ m.word.word }}<EnglishPomodoroMarker :target="wordTarget" :paused="pomodoroPaused"/></h2>
   <form @submit.prevent="requestCancelled=false;a.gradeOral()">
    <label for="formal-oral">词义和词类描述</label><textarea id="formal-oral" :value="m.run.draft" rows="4" maxlength="2000" required :disabled="m.busy||blocked" :readonly="m.completed" @input="a.oralDraft($event.target.value)"></textarea>
    <div class="formal-actions"><ActionFeedbackButton :cancelled="requestCancelled" class="formal-primary" type="primary" native-type="submit" :disabled="m.busy||m.completed||blocked" :loading="m.busy" :result-key="m.oralSaved?m.run.oral?.at:undefined" :context-key="m.word.id" :failed="blocked" loading-text="正在评阅…" success-text="已评阅" retry-text="重新提交">提交</ActionFeedbackButton><button v-if="m.busy" type="button" @click="requestCancelled=true;a.cancel()">取消等待</button></div>
   </form>
   <section v-if="m.run.oral" aria-label="批改结果"><p>拼写：<span class="mark-ok">✓</span> 词义：<span :class="m.run.oral.meaningPassed?'mark-ok':'mark-bad'">{{ m.run.oral.meaningPassed?'✓':'✗' }}</span> 词类：<span :class="m.run.oral.posPassed?'mark-ok':'mark-bad'">{{ m.run.oral.posPassed?'✓':'✗' }}</span></p><p v-if="m.run.oral.feedback&&!(m.run.oral.meaningPassed&&m.run.oral.posPassed)" class="mark-bad">{{ m.run.oral.feedback }}</p><ul><li v-for="(error,i) in m.run.oral.errors" :key="i" class="mark-bad">{{ error }}</li></ul><div class="formal-actions"><button v-if="!m.oralSaved||oralPassed&&!m.completed" type="button" @click="a.retryOralSave()">重试保存</button><button type="button" :disabled="m.busy||blocked||!m.oralSaved||oralPassed&&!m.completed" @click="a.nextWord()">{{ nextLabel }}</button><button type="button" :disabled="blocked" @click="a.navigate('word')">返回词条</button></div></section>
  </template>
  <div v-if="m.stage!=='oral'||!m.run.oral" class="formal-actions"><button type="button" :disabled="blocked" @click="a.navigate('word')">返回词条</button></div>
 </section>
</template>
<style scoped>
.formal-progress{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;min-height:28px}.formal-progress label{font-size:15px;font-weight:600;color:var(--ui-accent,#38694f)}
.mark-ok{color:#16a34a;font-weight:700}
.mark-bad{color:#dc2626}
.formal-study{max-width:760px;margin:20px auto;overflow-wrap:anywhere}.formal-study button,.formal-study input,.formal-study textarea{font:inherit;box-sizing:border-box}.formal-study button{min-height:44px;padding:10px 16px;background:white;border:1px solid #b9c6b9;border-radius:8px;color:inherit;cursor:pointer;line-height:1.5}.formal-study button:disabled{opacity:.55;cursor:default}.formal-study .formal-primary{background:#22634b;border-color:#22634b;color:white}.formal-study form{display:flex;flex-direction:column;gap:12px}.formal-study input,.formal-study textarea{width:100%;padding:12px;border:1px solid #8b9f8e;border-radius:8px;color:inherit;background:white;min-height:52px}.formal-study input{font-size:22px}.formal-actions{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0 0}.formal-muted{color:#596b60;font-size:14px}.formal-feedback{padding:20px;background:#eff6ee;border-radius:10px}.formal-feedback h3{margin-top:0}.formal-feedback .study-art{max-width:340px;margin:16px auto}.formal-answer{font-size:28px;font-weight:600}.formal-alert{padding:16px;background:#fff2e3;border:1px solid #d4a678;border-radius:8px}.formal-study :focus-visible{outline:3px solid #327958;outline-offset:3px}
@media(max-width:650px){.formal-feedback{padding:16px}.formal-actions .formal-primary{flex-grow:1}}
</style>
