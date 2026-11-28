import markerStyles from './english-pomodoro-marker.css?inline';

export const markerSvg = '<svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 10C4 3 0 19 6 27c4 6 16 6 20 0 6-8 2-24-10-17Z" stroke="currentColor" stroke-width="1.8"/><path d="M16 10V4m0 6-6-3m6 3 6-3" stroke="#66816a" stroke-width="1.8"/></svg>';

export function pendingPomodoroTargets(model, unitId) {
 const round=model?.rounds?.at(-1);
 if(round?.phase!=='learning')return [];
 return (round.targets||[]).filter(t=>t.unitId===unitId&&!(round.items||[]).some(i=>(i.eventId||i.id)===t.eventId&&(!t.newWord||i.newWord)));
}

// Only update the indicator; keep the classroom's inputs, focus and lesson state intact.
export function markPomodoroNode(node, target, paused=false) {
 let marker=Array.from(node.children).find(el=>el.classList.contains('english-pomo-marker'));
 if(!target){marker?.remove();return;}
 const doc=node.ownerDocument;
 if(!doc.getElementById('english-pomo-marker-style')){
  const style=doc.createElement('style');style.id='english-pomo-marker-style';style.textContent=markerStyles;doc.head.append(style);
 }
 if(!marker){marker=doc.createElement('span');marker.className='english-pomo-marker';marker.innerHTML=markerSvg;marker.setAttribute('role','img');marker.setAttribute('aria-label','当前番茄待学内容');marker.title='当前番茄待学内容';node.append(marker);}
 marker.dataset.pomodoroTarget=target.id;
 marker.classList.toggle('is-paused',paused);
}
