<script setup>
import {ref, onMounted, onBeforeUnmount} from 'vue';
import LoadingState from './LoadingState.vue';
const props=defineProps({unit:{type:Object,required:true},readReward:{type:Function,required:true}});
const emit=defineEmits(['close']);
const dialog=ref(),data=ref(null),error=ref('');
let alive=true,request=0,opener;
const money=value=>(value/100).toFixed(2);
async function load(){
 const run=++request;error.value='';data.value=null;
 try{const value=await props.readReward(props.unit.id);if(alive&&run===request)data.value=value;}
 catch(e){if(alive&&run===request)error.value=e.message||'奖励记录暂时无法读取';}
}
function backdrop(e){if(e.target!==dialog.value)return;const r=dialog.value.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.value.close();}
onMounted(()=>{opener=document.activeElement;dialog.value.showModal();load();});
onBeforeUnmount(()=>{alive=false;dialog.value?.close();if(opener?.isConnected)opener.focus();});
</script>
<template>
 <dialog ref="dialog" class="chapter-reward-sheet" aria-labelledby="chapter-reward-title" @close="emit('close')" @click="backdrop">
  <header><div><p class="reward-eyebrow">单元奖励</p><h2 id="chapter-reward-title">{{unit.title}}</h2></div><button class="reward-close" aria-label="关闭奖励" autofocus @click="dialog.close()"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.5"/></svg></button></header>
  <LoadingState class="reward-state" :loading="!data&&!error" :error="error" label="正在读取奖励…" retry skeleton @retry="load"/>
  <template v-if="data&&!error">
   <p class="reward-caption">本单元已获得</p>
   <div class="reward-balances">
    <section aria-label="游戏时间"><h3>游戏时间</h3><p class="reward-number" :class="{'is-zero':!data.game}"><strong>{{data.game}}</strong><span>分钟</span></p></section>
    <section aria-label="红包"><h3>红包</h3><p class="reward-number" :class="{'is-zero':!data.cash}"><strong>{{money(data.cash)}}</strong><span>元</span></p></section>
   </div>
   <dl class="reward-ledger"><div><dt>已兑现</dt><dd>{{data.paidGame}} 分钟<span aria-hidden="true"> / </span>{{money(data.paidCash)}} 元</dd></div><div><dt>待兑现</dt><dd>{{data.availableGame}} 分钟<span aria-hidden="true"> / </span>{{money(data.availableCash)}} 元</dd></div></dl>
  </template>
 </dialog>
</template>
<style scoped>
/* Two equal balance columns share the same baseline; no nested cards. */
.chapter-reward-sheet{box-sizing:border-box;width:560px;max-width:calc(100vw - 32px);max-height:calc(100dvh - 32px);margin:auto;padding:32px;border:0;border-radius:8px;background:#fff;color:#252825;font:14px/1.5 "Segoe UI","Microsoft YaHei",sans-serif;overflow:auto}
.chapter-reward-sheet::backdrop{background:rgb(20 25 22 / 38%)}
.chapter-reward-sheet header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}
.chapter-reward-sheet p,.chapter-reward-sheet h2,.chapter-reward-sheet h3,.chapter-reward-sheet dl,.chapter-reward-sheet dd{margin:0}
.chapter-reward-sheet .reward-eyebrow{font-size:12px;color:#747874;margin-bottom:6px}
.chapter-reward-sheet h2{font-size:24px;font-weight:500;line-height:1.35;overflow-wrap:anywhere}
.chapter-reward-sheet .reward-close{display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;margin:-8px -8px 0 0;padding:0;border:0;border-radius:6px;background:transparent;color:#535853;cursor:pointer}
.chapter-reward-sheet .reward-close:hover{background:#f2f3f2}
.chapter-reward-sheet button:focus-visible{outline:2px solid #555e55;outline-offset:3px}
.chapter-reward-sheet .reward-caption{margin-top:38px;color:#747874;font-size:12px}
.reward-balances{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;margin-top:14px}
.chapter-reward-sheet h3{font-size:14px;font-weight:400;color:#565c56}
.chapter-reward-sheet .reward-number{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px;margin-top:8px;font-variant-numeric:tabular-nums}
.reward-number strong{font-size:52px;font-weight:500;line-height:1.15;letter-spacing:-2px;overflow-wrap:anywhere}
.reward-number span{color:#747874;font-size:13px}.reward-number.is-zero strong{color:#959a95}
.chapter-reward-sheet .reward-ledger{display:grid;gap:12px;margin-top:30px;padding-top:20px;border-top:1px solid #e7e9e7;font-size:13px;font-variant-numeric:tabular-nums}
.reward-ledger>div{display:flex;justify-content:space-between;gap:16px}.reward-ledger dt{color:#747874}.reward-ledger dd{text-align:right}.reward-ledger dd span{padding:0 10px;color:#a8ada8}
.chapter-reward-sheet .reward-state{padding:40px 0;min-height:80px;color:#626862}.reward-state button{margin-top:16px;min-height:44px;padding:8px 16px;border:1px solid #d7dad7;background:white;border-radius:6px;color:inherit;cursor:pointer}
@media(max-width:520px){.chapter-reward-sheet{padding:24px}.chapter-reward-sheet h2{font-size:22px}.reward-balances{gap:16px}.reward-number strong{font-size:40px;letter-spacing:-1.5px}.chapter-reward-sheet .reward-number{gap:5px}.chapter-reward-sheet .reward-caption{margin-top:30px}}
</style>
