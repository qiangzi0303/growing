<script setup>
import {computed,nextTick,onBeforeUnmount,onMounted,ref,watch} from 'vue';
const props=defineProps({columns:{type:Array,default:()=>[]},modelValue:{type:Array,default:()=>[]},title:{type:String,default:'选择'},active:{type:Boolean,default:true}});
const emit=defineEmits(['confirm','cancel']);
const query=ref(''),root=ref(),search=ref();let opener;
const filtered=computed(()=>{const term=query.value.trim().toLocaleLowerCase();return props.columns.filter(option=>!term||`${option.text} ${option.group||''}`.toLocaleLowerCase().includes(term));});
const selected=computed(()=>props.columns.find(option=>option.value===props.modelValue[0]&&!option.disabled));
function restore(){if(opener?.isConnected)opener.focus({preventScroll:true});opener=null;}
async function opened(){opener=document.activeElement;query.value='';await nextTick();if(props.active)search.value?.focus({preventScroll:true});}
onMounted(()=>{if(props.active)opened();});
watch(()=>props.active,active=>{if(active)opened();else restore();});
onBeforeUnmount(restore);
function choose(option){if(!props.active||!option||option.disabled)return;emit('confirm',{selectedValues:[option.value],selectedOptions:[option]});}
function keydown(event){
 if(event.key==='Tab'){const scope=root.value.closest('.van-popup')||root.value,items=[...scope.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href],[tabindex="0"]')].filter(el=>!el.closest('[aria-hidden="true"]'));const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}return;}
 if(event.key==='Escape'){event.preventDefault();event.stopPropagation();emit('cancel');return;}
 if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key)||event.isComposing)return;
 const buttons=[...root.value.querySelectorAll('.search-choice-option:not(:disabled)')];if(!buttons.length)return;
 if(event.target===search.value&&!['ArrowDown','ArrowUp'].includes(event.key))return;
 event.preventDefault();const index=buttons.indexOf(document.activeElement),next=event.key==='Home'?0:event.key==='End'?buttons.length-1:event.key==='ArrowDown'?(index+1)%buttons.length:(index<=0?buttons.length:index)-1;
 buttons[next].focus({preventScroll:true});buttons[next].scrollIntoView?.({block:'nearest'});
}
</script>
<template>
 <section ref="root" class="searchable-picker" :aria-label="title" @keydown="keydown">
  <header class="search-choice-header"><button type="button" class="search-choice-cancel" aria-label="关闭选择" @click="emit('cancel')"><slot name="cancel">取消</slot></button><strong>{{title}}</strong><button type="button" class="search-choice-confirm" :disabled="!selected" @click="choose(selected)">确认</button></header>
  <div class="search-choice-search"><input ref="search" v-model="query" type="search" autocomplete="off" :aria-label="'搜索'+title" placeholder="输入名称查找"><button v-if="query" type="button" aria-label="清除搜索" @click="query='';search.focus()">×</button></div>
  <div class="search-choice-list" role="listbox" :aria-label="title"><button v-for="option in filtered" :key="option.value" type="button" role="option" class="search-choice-option" :aria-selected="option.value===modelValue[0]" :disabled="option.disabled" @click="choose(option)"><span><small v-if="option.group">{{option.group}}</small><slot name="option" v-bind="option">{{option.text}}</slot></span><span v-if="option.value===modelValue[0]" aria-hidden="true">✓</span></button></div>
  <p v-if="!filtered.length" class="search-choice-empty" role="status">没有匹配的选项</p>
 </section>
</template>
<style scoped>
.searchable-picker{color:var(--ui-ink,#263c30);background:var(--ui-surface,#fff);font:15px/1.5 "Segoe UI","Microsoft YaHei",system-ui,sans-serif;min-width:0;width:100%;padding-bottom:env(safe-area-inset-bottom)}
.search-choice-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 10px;margin:0}.search-choice-header strong{font-size:16px;overflow-wrap:anywhere}.searchable-picker button{font:inherit;box-shadow:none;cursor:pointer}.search-choice-header button{min-width:44px;min-height:44px;padding:8px;border:0;background:transparent;color:var(--ui-accent,#38694f)}.searchable-picker button:disabled{opacity:.45;cursor:default}.search-choice-search{display:flex;position:relative;margin:4px 16px 8px}.search-choice-search input{box-sizing:border-box;min-width:0;width:100%;height:44px;padding:10px 44px 10px 12px;border:1px solid var(--ui-control,#bbc8ae);border-radius:8px;background:var(--ui-soft,#f5f7f2);color:inherit;font:inherit}.search-choice-search>button{position:absolute;right:0;top:0;width:44px;height:44px;padding:0;border:0;background:transparent;font-size:24px;color:inherit}.search-choice-list{max-height:min(48dvh,360px);min-height:44px;overflow-y:auto;overscroll-behavior:contain;padding:0 8px}.searchable-picker .search-choice-option{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;height:auto;min-height:48px;padding:12px;border:0;border-radius:8px;text-align:left;white-space:normal;overflow-wrap:anywhere;color:inherit;background:transparent;transition:background-color .15s}.search-choice-option[aria-selected=true]{background:var(--ui-soft,#edf4e9);color:var(--ui-accent,#38694f);font-weight:600}.search-choice-option small{display:block;font-size:12px;color:var(--ui-muted,#627368)}.searchable-picker button:focus-visible,.search-choice-search input:focus-visible{outline:2px solid var(--ui-accent,#38694f);outline-offset:-2px}.search-choice-empty{margin:16px;color:var(--ui-muted,#627368);text-align:center}@media(prefers-reduced-motion:reduce){.search-choice-option{transition:none!important}}
.search-choice-search input::-webkit-search-cancel-button{display:none}
</style>
