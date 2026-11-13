<script setup>
import {ref,onMounted,watch,nextTick} from 'vue';
import {Button,Checkbox} from 'vant';
const props=defineProps({pages:{type:Array,default:()=>[[]]},paint:Function,disabled:Boolean,label:String});
const emit=defineEmits(['change']);const canvas=ref(),page=ref(0),tool=ref('pen'),finger=ref(false),status=ref('');let stroke=null,redo=[];
const draw=()=>{if(canvas.value)props.paint(canvas.value,props.pages[page.value]||[]);};
watch(()=>props.pages,()=>{page.value=Math.min(page.value,props.pages.length-1);nextTick(draw);},{deep:true});onMounted(draw);
function change(pages){emit('change',pages);}
function point(e){const r=canvas.value.getBoundingClientRect();return [Math.round(Math.max(0,Math.min(800,(e.clientX-r.left)*800/r.width))),Math.round(Math.max(0,Math.min(1000,(e.clientY-r.top)*1000/r.height)))];}
function down(e){if(props.disabled||stroke||e.button!==0||e.pointerType==='touch'&&!finger.value)return;const total=props.pages.flat().reduce((n,s)=>n+s.points.length,0);if(total>=18000){status.value='本题笔迹已达上限';return;}e.preventDefault();canvas.value.setPointerCapture(e.pointerId);stroke={pointer:e.pointerId,tool:tool.value,points:[point(e)],remaining:18000-total-1};redo=[];props.paint(canvas.value,[...(props.pages[page.value]||[]),stroke]);}
function move(e){if(!stroke||e.pointerId!==stroke.pointer||props.disabled)return;e.preventDefault();if(stroke.remaining>0){stroke.points.push(point(e));stroke.remaining--;}props.paint(canvas.value,[...(props.pages[page.value]||[]),stroke]);}
function end(e){if(!stroke||e.pointerId!==stroke.pointer)return;const pages=props.pages.map(p=>p.map(s=>({...s,points:s.points.map(p=>[...p])})));pages[page.value]??=[];pages[page.value].push({tool:stroke.tool,points:stroke.points});stroke=null;change(pages);}
function edit(action){if(props.disabled||stroke)return;const pages=props.pages.map(p=>p.slice());if(action==='undo'&&pages[page.value].length)redo.push(pages[page.value].pop());if(action==='redo'&&redo.length)pages[page.value].push(redo.pop());if(action==='add'&&pages.length<6){pages.push([]);page.value=pages.length-1;redo=[];}change(pages);}
function turn(delta){if(stroke||props.disabled)return;page.value+=delta;redo=[];nextTick(draw);}
</script>
<template><section class="paper-ink"><div class="ink-tools"><Button :disabled="disabled" :type="tool==='pen'?'primary':'default'" @click="tool='pen'">钢笔</Button><Button :disabled="disabled" :type="tool==='eraser'?'primary':'default'" @click="tool='eraser'">橡皮</Button><Button :disabled="disabled||!pages[page]?.length" @click="edit('undo')">撤销</Button><Button :disabled="disabled||!redo.length" @click="edit('redo')">重做</Button><Checkbox v-model="finger" :disabled="disabled">允许手指书写</Checkbox></div><p>原始笔迹自动保存，每题最多 6 页。</p><canvas ref="canvas" width="800" height="1000" :aria-label="label" @pointerdown="down" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end"/><nav class="ink-tools"><Button icon="arrow-left" aria-label="上一页原稿" :disabled="disabled||page===0" @click="turn(-1)"/><span>{{page+1}} / {{pages.length}} 页</span><Button icon="arrow" aria-label="下一页原稿" :disabled="disabled||page>=pages.length-1" @click="turn(1)"/><Button :disabled="disabled||pages.length>=6" @click="edit('add')">加一页</Button></nav><p role="status">{{status}}</p></section></template>
<style scoped>.ink-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}.paper-ink canvas{display:block;width:100%;max-width:800px;height:auto;border:1px solid #dce4dc;touch-action:none;background:repeating-linear-gradient(#fff 0px,#fff 39px,#edf0ec 40px)}.paper-ink p{font-size:13px;color:#627368}</style>

<style scoped>
/* visual-restore-legacy */
.paper-ink{padding:12px;border:1px solid #e0e3dc;border-radius:12px;background:#fff;color:#263c30;font:inherit}.ink-tools{gap:8px;margin:10px 0}.paper-ink :deep(.van-button){height:auto;min-height:44px;padding:8px 12px;border:1px solid #bbc8ae;border-radius:8px;background:#f0f4eb;color:#263c30;font:inherit}.paper-ink :deep(.van-button--primary){background:#38694f;border-color:#38694f;color:#fff}.paper-ink canvas{background:#fff;border:1px solid #b9c6a9;border-radius:10px;cursor:crosshair}.paper-ink p{font-size:13px;color:#5e6b63}
</style>
