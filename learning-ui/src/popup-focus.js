import {onBeforeUnmount} from 'vue';
let serial=0;
export function createPopupFocus(doc){
 const entries=new Map(),prefix='popup-'+(++serial)+'-';
 const controls=el=>Array.from(el?.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')||[]).filter(x=>x.getClientRects().length&&!x.closest('[inert],[aria-hidden="true"]'));
 function bind(key,close){
  let item=entries.get(key);if(!item){item={token:prefix+entries.size,trigger:null};entries.set(key,item);}item.close=close;
  return {'data-popup-focus':item.token,onOpen(){item.trigger=doc.activeElement;},onOpened(){const el=doc.querySelector('[data-popup-focus="'+item.token+'"]');const first=controls(el)[0];if(first)first.focus();else if(el){el.tabIndex=-1;el.focus();}},onClosed(){if(item.trigger?.isConnected)item.trigger.focus();item.trigger=null;},onKeydown(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();item.close?.();return;}if(e.key!=='Tab')return;const list=controls(e.currentTarget);if(!list.length){e.preventDefault();return;}const first=list[0],last=list[list.length-1];if(e.shiftKey&&(doc.activeElement===first||!list.includes(doc.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(doc.activeElement===last||!list.includes(doc.activeElement))){e.preventDefault();first.focus();}}};
 }
 return {bind,dispose(){entries.clear();}};
}
export function usePopupFocus(){const manager=createPopupFocus(document);onBeforeUnmount(manager.dispose);return manager.bind;}
