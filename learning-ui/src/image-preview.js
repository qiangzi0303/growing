import {nextTick,onBeforeUnmount} from 'vue';
import {showImagePreview} from 'vant';
import 'vant/es/image-preview/style';
let current;
export function useImagePreview(){
 let owned;
 onBeforeUnmount(()=>{if(current===owned){owned?.instance?.close();owned?.finish(true);}});
 return options=>{
  current?.finish(false);
  const trigger=document.activeElement,entry={};owned=current=entry;
  const close=()=>{if(current===entry)entry.instance?.close();};
  const keydown=e=>{if(current!==entry)return;if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='Tab'){e.preventDefault();entry.button?.focus();}else if((e.key==='Enter'||e.key===' ')&&e.target===entry.button){e.preventDefault();close();}};
  entry.finish=restore=>{document.removeEventListener('keydown',keydown,true);if(current===entry){current=null;if(restore&&trigger?.isConnected)trigger.focus({preventScroll:true});}};
  entry.instance=showImagePreview({...options,closeable:true,closeIcon:'cross',className:'paper-image-preview',onClose(){document.removeEventListener('keydown',keydown,true);},onClosed(){entry.finish(true);}});
  document.addEventListener('keydown',keydown,true);
  nextTick(()=>{if(current!==entry)return;entry.button=document.querySelector('.paper-image-preview .van-image-preview__close-icon');if(entry.button){entry.button.tabIndex=0;Object.assign(entry.button.style,{width:'44px',height:'44px',display:'grid',placeItems:'center'});entry.button.setAttribute('role','button');entry.button.setAttribute('aria-label','关闭图片预览');entry.button.focus({preventScroll:true});}});
  return entry.instance;
 };
}
