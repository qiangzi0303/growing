<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue';
import { Button, Icon, Popup, Cell, CellGroup, Tabs, Tab, Form, Field, Picker, Calendar, Dialog, Loading } from 'vant';
import 'vant/es/button/style';
import 'vant/es/icon/style';
import 'vant/es/popup/style';
import 'vant/es/cell/style';
import 'vant/es/cell-group/style';
import 'vant/es/tabs/style';
import 'vant/es/tab/style';
import 'vant/es/form/style';
import 'vant/es/field/style';
import 'vant/es/picker/style';
import 'vant/es/calendar/style';
import 'vant/es/dialog/style';
import 'vant/es/loading/style';

const {adapter,calendarOnly}=defineProps({adapter:{type:Object,required:true},calendarOnly:{type:Boolean,default:false}});
const menu=ref(false),page=ref(''),kind=ref('deepseek'),message=ref(''),error=ref(''),busy=ref(false),confirmClear=ref(false),picker=ref('');
const trigger=ref(),panel=ref(),unit=ref(''),units=ref([]),records=ref({days:{},baseline:0,datedMastery:false});
const selected=ref(new Date()),calendar=ref(),nativeModel=ref(false);
const draft=reactive({apiKey:'',baseUrl:'',model:'',voice:''});
let version=0,controller,alive=true;
const service=computed(()=>adapter[kind.value]);
const voices=computed(()=> (adapter.voice?.voices||[]).map(v=>typeof v==='string'?{text:v,value:v}:{text:v.text||v.label||v.name||v.id,value:v.value||v.id||v.name}));
const actions=[['rankings','我的排行榜'],['learningSettings','学习设置'],['account','账号设置'],['device','设备设置'],['logout','退出账号']];
const title=computed(()=>page.value==='calendar'?'学习日历':'设置');
const day=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const row=computed(()=>records.value.days?.[day(selected.value)]||{});
const unitLabel=computed(()=>units.value.find(v=>v.id===unit.value)?.label||'选择课程单元');
const dates=computed(()=>Object.keys(records.value.days||{}).filter(k=>records.value.days[k].newCount).sort());
const range=computed(()=>{const all=[day(new Date()),...Object.keys(records.value.days||{})].sort();return {min:new Date(Number(all[0].slice(0,4))-1,0,1),max:new Date(Number(all.at(-1).slice(0,4))+1,11,31)};});
const total=computed(()=>Number(records.value.baseline||0)+dates.value.reduce((n,k)=>n+Number(records.value.days[k].newCount||0),0));
const curve=computed(()=>{let sum=Number(records.value.baseline||0);const y=n=>126-n/Math.max(1,total.value)*100;let p=`M 16 ${y(sum)}`;dates.value.forEach((d,i)=>{sum+=Number(records.value.days[d].newCount||0);p+=` H ${16+(i+1)/(dates.value.length+1)*328} V ${y(sum)}`;});return p+' H 344';});
const duration=ms=>`${Math.floor(Number(ms||0)/60000)} 分 ${Math.floor(Number(ms||0)%60000/1000)} 秒`;
function cancel(){version++;controller?.abort();controller=null;busy.value=false;}
function wipe(){draft.apiKey='';}
function close(){cancel();wipe();menu.value=false;page.value='';picker.value='';confirmClear.value=false;message.value='';error.value='';nextTick(()=>{if(alive)trigger.value?.$el?.focus();});}
function focusPanel(){nextTick(()=>{const el=[...document.querySelectorAll('.growing-vant-popup')].filter(el=>el.style.display!=='none').at(-1);el?.querySelector('button,input,[tabindex="0"]')?.focus();});}
function failure(e){error.value=e?.message||'操作失败，请重试。';}
async function loadInfo(){cancel();controller=new AbortController();wipe();message.value='';error.value='';draft.baseUrl='';draft.model='';draft.voice='';const request=version;busy.value=true;try{const info=await service.value.info(controller.signal);if(request!==version||!alive)return;if(info.error)throw Error(info.error);nativeModel.value=!!info.native;draft.baseUrl=info.baseUrl||info.base||'';draft.model=info.model||'';draft.voice=info.voice||info.voiceType||voices.value[0]?.value||'';message.value=info.configured?'已保存配置；密钥留空沿用。':info.serverConfigured?'服务端连接已配置；可保存个人密钥覆盖。':'尚未配置个人密钥。';}catch(e){if(request===version&&e?.name!=='AbortError')failure(e);}finally{if(request===version)busy.value=false;}}
async function openSettings(which){menu.value=false;page.value='settings';kind.value=which;await loadInfo();focusPanel();}
async function save(){cancel();const request=version;busy.value=true;error.value='';try{await service.value.save({apiKey:draft.apiKey,model:draft.model,base:draft.baseUrl,voice:draft.voice});if(request!==version||!alive)return;wipe();message.value='已保存配置。';}catch(e){if(request===version)failure(e);}finally{if(request===version)busy.value=false;}}
async function testConnection(){cancel();controller=new AbortController();const request=version;busy.value=true;error.value='';message.value='';try{const result=await service.value.test(controller.signal);if(request!==version||!alive)return;message.value=kind.value==='voice'?'语音配置可用，实际连通性以语音会话为准。':typeof result==='string'?result:result?.message||'连接测试成功。';}catch(e){if(request===version&&e?.name!=='AbortError')failure(e);}finally{if(request===version)busy.value=false;}}
async function clear(){confirmClear.value=false;cancel();const request=version;busy.value=true;error.value='';try{await service.value.clear();if(request!==version||!alive)return;wipe();message.value='已清除个人配置。';}catch(e){if(request===version)failure(e);}finally{if(request===version)busy.value=false;}}
async function perform(name){menu.value=false;error.value='';try{await adapter.actions[name]();}catch(e){failure(e);menu.value=true;}}
async function readUnit(){cancel();const request=version;busy.value=true;error.value='';records.value={days:{},baseline:0,datedMastery:false};try{const data=await adapter.calendar.read(unit.value);if(request===version&&alive)records.value=data;}catch(e){if(request===version)failure(e);}finally{if(request===version)busy.value=false;}}
async function openCalendar(){menu.value=false;page.value='calendar';cancel();const request=version;busy.value=true;error.value='';try{const list=await adapter.calendar.units();if(request!==version||!alive)return;units.value=list;unit.value=list[0]?.id||'';if(unit.value)await readUnit();}catch(e){if(request===version)failure(e);}finally{if(request===version)busy.value=false;}focusPanel();}
function picked({selectedValues}){if(picker.value==='unit'){unit.value=selectedValues[0];readUnit();}else draft.voice=selectedValues[0];picker.value='';}
function today(){selected.value=new Date();calendar.value?.reset(new Date());calendar.value?.scrollToDate(new Date());}
function formatDate(d){const r=records.value.days?.[day(d.date)];if(r)d.bottomInfo=r.newCount?`+${r.newCount}`:'·';return d;}
function keydown(event){if(!(page.value||menu.value||picker.value||confirmClear.value))return;if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(picker.value)picker.value='';else if(confirmClear.value)confirmClear.value=false;else close();}else if(event.key==='Tab'){const popup=[...document.querySelectorAll('.growing-vant-popup')].filter(el=>el.style.display!=='none').at(-1);const nodes=popup?.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}}
document.addEventListener('keydown',keydown,true);
onBeforeUnmount(()=>{alive=false;cancel();wipe();document.removeEventListener('keydown',keydown,true);});
defineExpose({close,openCalendar,isOpen:()=>!!(page.value||menu.value||picker.value||confirmClear.value)});
</script>

<template>
 <div class="growing-vant-home">
  <Button v-if="!calendarOnly" id="vant-menu-trigger" ref="trigger" class="growing-vant-trigger" aria-label="设置菜单" aria-haspopup="dialog" :aria-expanded="menu" @click="menu=true;error=''"><Icon name="wap-nav" size="24" /></Button>
  <Popup v-model:show="menu" :overlay="false" teleport="body" class="growing-vant-popup growing-vant-menu" position="left" round close-on-popstate @opened="focusPanel" @closed="!page && trigger?.$el?.focus()">
   <div ref="panel"><header class="growing-vant-header"><h2>设置菜单</h2><Button icon="cross" aria-label="关闭菜单" @click="close" /></header><p class="growing-vant-identity">{{ adapter.identity || '学习空间' }}</p>
    <CellGroup inset><Cell v-if="adapter.calendar" title="学习日历" icon="calendar-o" is-link data-vant-action="calendar" @click="openCalendar"/><Cell v-if="adapter.deepseek" title="DeepSeek 密钥" icon="setting-o" is-link data-vant-action="deepseek" @click="openSettings('deepseek')"/><Cell v-if="adapter.voice" title="语音 Key" icon="volume-o" is-link data-vant-action="voice" @click="openSettings('voice')"/><template v-for="[action,label] in actions" :key="action"><Cell v-if="adapter.actions?.[action]" :title="label" is-link :data-vant-action="action" @click="perform(action)" /></template></CellGroup><p v-if="error" role="alert" class="growing-vant-error">{{ error }}</p>
   </div>
  </Popup>
  <Popup :show="!!page" teleport="body" class="growing-vant-popup growing-vant-sheet" :class="{'growing-vant-calendar-sheet':page==='calendar'}" position="bottom" round close-on-popstate @update:show="show => !show && close()" @click-overlay="close" @opened="focusPanel">
   <section ref="panel" :aria-label="title"><header class="growing-vant-header"><h2>{{ title }}</h2><Button icon="cross" :aria-label="'关闭'+title" @click="close" /></header>
    <template v-if="page==='settings'">
     <Tabs v-model:active="kind" @change="loadInfo"><Tab v-if="adapter.deepseek" name="deepseek" title="DeepSeek 密钥"/><Tab v-if="adapter.voice" name="voice" title="语音 Key"/></Tabs>
     <p class="growing-vant-note">密钥仅保存在当前账号。输入留空时沿用已保存密钥。</p>
     <Form :disabled="busy" @submit="!busy && save()"><CellGroup inset><Field v-model="draft.apiKey" type="password" label="个人密钥" name="vant-key" autocomplete="new-password" placeholder="留空沿用已保存密钥" data-vant-key/><Field v-if="kind==='voice'" v-model="draft.baseUrl" label="服务地址" name="vant-base" placeholder="默认服务地址" data-vant-base/><Field v-if="kind==='deepseek'" v-model="draft.model" :readonly="nativeModel" label="模型" name="vant-model" placeholder="deepseek-chat"/><template v-else><Field v-model="draft.voice" label="音色 ID" placeholder="可填写自定义音色 ID"/><Cell title="选择内置音色" :value="draft.voice" is-link @click="!busy && (picker='voice')"/></template></CellGroup><div class="growing-vant-buttons"><Button type="primary" native-type="submit" :loading="busy" :disabled="busy" data-vant-save>保存配置</Button><Button :disabled="busy" data-vant-test @click="testConnection">{{ kind==='voice'?'检查语音配置':'测试已保存连接' }}</Button><Button :disabled="busy" @click="confirmClear=true">清除配置</Button></div></Form>
    </template>
    <template v-if="page==='calendar'">
     <p class="growing-vant-note">只读展示已保存的学习记录；无日期的旧记录不补算日期。</p>
     <Cell :title="unitLabel" is-link data-vant-unit @click="picker='unit'"/>
     <template v-if="unit && !busy"><div class="growing-vant-month"><Button @click="today">回到今天</Button></div>
      <Calendar ref="calendar" switch-mode="month" :poppable="false" :show-confirm="false" :show-title="false" :default-date="selected" :min-date="range.min" :max-date="range.max" :formatter="formatDate" :style="{height:'360px'}" @select="selected=$event">
       <template #prev-month="{disabled}"><Button class="growing-vant-month-action" icon="arrow-left" aria-label="上个月" :disabled="disabled"/></template>
       <template #next-month="{disabled}"><Button class="growing-vant-month-action" icon="arrow" aria-label="下个月" :disabled="disabled"/></template>
      </Calendar>
      <section class="growing-vant-summary" aria-live="polite"><h3>{{ day(selected) }} · 学习摘要</h3><p>有效学习 {{ duration(row.ms) }}</p><p>阅读 {{ row.reads||0 }} 次 · AI 评分 {{ row.grades||0 }} 次 · 练习 {{ row.practice||0 }} 轮</p><p v-if="row.special || row.words || row.lessons">专项 {{ row.special||0 }} 题 · 默写记录 {{ row.words||0 }} 项 · 检测记录 {{ row.lessons||0 }} 项</p><p v-if="records.datedMastery">新增首次达标 {{ row.newCount||0 }} 项</p><p v-for="(item,index) in row.items||[]" :key="index">{{ item.title }} · AI 评分 {{ item.grades||0 }} 次 · 练习 {{ item.practice||0 }} 轮 · {{ duration(item.ms) }}</p><p v-if="!records.days?.[day(selected)]">当天暂无本单元的带日期学习记录。</p></section>
      <section v-if="records.datedMastery" class="growing-vant-summary"><h3>首次达标累计 · {{ total }} 项</h3><svg viewBox="0 0 360 145" role="img" aria-label="首次达标成长曲线"><path :d="curve"/><text x="16" y="142">{{ dates[0]||'暂无带日期记录' }}</text><text x="344" y="142" text-anchor="end">{{ dates.at(-1)||'' }}</text></svg><p v-if="records.baseline">{{ records.baseline }} 项历史达标记录日期未知，计入累计起点。</p></section>
     </template><p v-if="!units.length && !busy" class="growing-vant-note">暂无已核对课程单元。</p>
    </template>
    <p v-if="busy" class="growing-vant-feedback" role="status"><Loading size="20"/> 正在处理…</p><p v-if="message" role="status" class="growing-vant-feedback">{{ message }}</p><p v-if="error" role="alert" class="growing-vant-error">{{ error }}</p>
   </section>
  </Popup>
  <Popup :show="!!picker" teleport="body" class="growing-vant-popup growing-vant-picker" position="bottom" round close-on-popstate @update:show="show => !show && (picker='')" @click-overlay="picker=''">
   <Picker :title="picker==='unit'?'选择课程单元':'选择音色'" :columns="picker==='unit'?units.map(u=>({text:u.label,value:u.id})):voices" @confirm="picked" @cancel="picker=''"><template #cancel><Button icon="cross" aria-label="关闭选择" style="width:44px;height:44px;padding:0" @click="picker=''"/></template></Picker>
  </Popup>
  <Dialog v-model:show="confirmClear" teleport="body" class="growing-vant-confirm" title="清除个人配置">仅清除当前账号的这项配置，确定继续？<template #footer><div class="growing-vant-buttons"><Button icon="cross" aria-label="关闭清除确认" style="flex:0 0 44px;padding:0" @click="confirmClear=false"/><Button type="primary" @click="clear">清除个人配置</Button></div></template></Dialog>
 </div>
</template>
<style scoped>
.growing-vant-home,.growing-vant-popup,.growing-vant-confirm{--van-primary-color:#25332c;--van-text-color:#25332c;--van-button-primary-background:#25332c;--van-button-primary-border-color:#25332c;font:14px/1.7 "Segoe UI","Microsoft YaHei",system-ui,sans-serif;color:#25332c}
.growing-vant-trigger.van-button{width:44px;height:44px;padding:0;border:0;border-radius:9px;background:transparent;color:#25332c}.growing-vant-trigger.van-button:hover{background:#edf3e9}
.growing-vant-menu{top:64px;left:max(20px,calc((100vw - 1200px)/2));width:260px;height:auto;max-height:calc(100dvh - 100px);padding:14px;background:#fff;border:1px solid #e0e6e1;border-radius:12px!important;box-shadow:0 10px 28px #14251b1a;transform:none}.growing-vant-menu .growing-vant-header{padding:0;height:32px;justify-content:flex-end}.growing-vant-menu .growing-vant-header h2{display:none}.growing-vant-identity{margin:0 0 4px;padding:0;font-size:13px}.growing-vant-menu :deep(.van-cell-group--inset){margin:0}.growing-vant-menu :deep(.van-cell){margin-top:9px;min-height:40px;padding:8px 14px;border:1px solid #b8c5bc;border-radius:8px;background:#fff;font:14px/1.5 "Segoe UI","Microsoft YaHei",system-ui,sans-serif;color:#25332c}.growing-vant-menu :deep(.van-cell__left-icon),.growing-vant-menu :deep(.van-cell__right-icon){display:none}.growing-vant-menu :deep(.van-cell:after){display:none}
.growing-vant-sheet{top:50%;bottom:auto;left:50%;width:min(640px,calc(100vw - 32px));max-height:calc(100svh - 32px);padding:24px;background:#fff;border:1px solid #e0e6e1;border-radius:12px;transform:translate(-50%,-50%)}.growing-vant-header{padding:0;gap:16px}.growing-vant-header h2{font-size:22px;font-weight:600}.growing-vant-header .van-button{width:44px;height:44px;padding:0;border:1px solid #b8c5bc;border-radius:8px;background:#fff}.growing-vant-note{padding:0;margin:16px 0;color:#5e6b63}.growing-vant-buttons{padding:0;gap:8px;margin:18px 0 0}.growing-vant-buttons :deep(.van-button){flex:0 1 auto;min-height:44px;height:auto;padding:9px 16px;border:1px solid #b8c5bc;border-radius:8px;background:white;font:14px/1.5 "Segoe UI","Microsoft YaHei",system-ui,sans-serif;color:#25332c}.growing-vant-buttons :deep(.van-button--primary){background:#25332c;border-color:#25332c;color:#fff}
.growing-vant-sheet :deep(.van-tabs__wrap){height:auto;margin:20px 0}.growing-vant-sheet :deep(.van-tabs__nav){padding:0;gap:8px}.growing-vant-sheet :deep(.van-tab){flex:0 1 auto;min-height:44px;padding:9px 16px;border:1px solid #b8c5bc;border-radius:8px;color:#25332c}.growing-vant-sheet :deep(.van-tab--active){background:#25332c;border-color:#25332c;color:#fff}.growing-vant-sheet :deep(.van-tabs__line){display:none}.growing-vant-sheet :deep(.van-cell-group--inset){margin:0}.growing-vant-sheet :deep(.van-field){display:block;padding:0;margin:16px 0;background:transparent}.growing-vant-sheet :deep(.van-field:after){display:none}.growing-vant-sheet :deep(.van-field__label){width:auto;margin-bottom:6px}.growing-vant-sheet :deep(.van-field__control){min-height:40px;padding:10px 12px;border:1px solid #b8c5bc;border-radius:8px;font-size:16px;background:#fff}.growing-vant-feedback,.growing-vant-error{padding:0;margin:16px 0}.growing-vant-summary{margin:16px 0;padding:16px;background:#f5f7f5;border:1px solid #e0e6e1;border-radius:8px}.growing-vant-month{padding:12px 0}.growing-vant-sheet :deep(.van-calendar__header){box-shadow:none}.growing-vant-sheet :deep(.van-calendar__selected-day){background:#38694f;border-radius:6px}.growing-vant-picker{background:#fff}.growing-vant-confirm{background:#fff;border:1px solid #e0e6e1;border-radius:12px}
@media(max-width:600px){.growing-vant-menu{top:62px;left:16px}.growing-vant-sheet{padding:18px}.growing-vant-menu :deep(.van-cell){min-height:44px}}
</style>

<style scoped>
#vant-menu-trigger.van-button{padding:0;border:0;background:transparent;box-shadow:none}.growing-vant-sheet.van-popup--bottom.van-popup--round{border-radius:12px}.growing-vant-calendar-sheet{width:min(760px,calc(100vw - 32px))}
</style>
