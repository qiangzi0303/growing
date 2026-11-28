import {onBeforeUnmount,shallowRef,watch} from 'vue';

// VisualViewport also shrinks when a keyboard overlays the layout viewport.
// Limit listeners to open editors; leave pinch zoom to the browser.
export function useEditorViewport(active){
 const style=shallowRef({});let detach=()=>{};
 watch(active,open=>{
  detach();style.value={};
  const viewport=window.visualViewport;
  if(!open||!viewport)return;
  const update=()=>{
   style.value=viewport.scale!==1?{}:{
    '--editor-height':viewport.height+'px',
    '--editor-top':viewport.offsetTop+'px'
   };
  };
  viewport.addEventListener('resize',update);
  viewport.addEventListener('scroll',update);
  detach=()=>{viewport.removeEventListener('resize',update);viewport.removeEventListener('scroll',update);};
  update();
 },{immediate:true});
 onBeforeUnmount(()=>detach());
 return style;
}
