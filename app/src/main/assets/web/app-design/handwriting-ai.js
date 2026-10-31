/* Shared direct-image assessment for handwritten homework and examination answers. */
(()=>{
  'use strict';
  const C=window.GrowingHandwriting;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function pageImage(strokes,draw,width=800,height=1100){
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;draw(canvas,strokes);
    const ctx=canvas.getContext('2d');ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.globalCompositeOperation='source-over';
    return canvas.toDataURL('image/png');
  }
  async function request(data,signal){
    const native=window.GrowingNative,base=String(native?.cloudApiUrl?.()||'').replace(/\/$/,'');
    const headers={'Content-Type':'application/json','X-Growing-Client':'1'};
    if(native){
      let session;try{session=JSON.parse(localStorage.getItem('growing-cloud-session-v1')||'null');}catch{}
      if(!base||!session?.token||!['Student','Admin'].includes(session.user?.role)||session.user.role==='Student'&&localStorage.getItem('growing-cloud-binding-v1')!==session.user.id)throw Error('请先到云同步中心登录并关联当前学生账号。');
      headers.Authorization='Bearer '+session.token;
    }
    const response=await fetch(base+'/api/handwriting/ai',{method:'POST',credentials:native?'omit':'same-origin',signal,headers,body:JSON.stringify({...data,kind:'grade'})});
    let result;try{result=await response.json();}catch{throw Error('手写批改服务返回无效数据，原稿已保留。');}
    if(!response.ok)throw Error(result.error||'手写批改失败，请稍后重试。');
    const g={...result,revision:0,at:new Date().toISOString()},limits=data.subject==='english'?[25,20,35,20]:[20,30,30,20];
    const ids=data.nodeIds||Object.keys(C.knowledgeUnits[data.unitId]||{});
    if(result.source!=='handwriting'||!C.grade(g)||!g.needsReview&&(g.parts.some((v,i)=>v>limits[i])||g.knowledge.some(k=>!ids.includes(k.nodeId))||data.nodeIds&&g.knowledge.length!==ids.length))throw Error('手写批改结果不完整或分数、知识点无效，本次不计分。');
    return result;
  }
  function details(g,linkPrefix=''){
    const corrections=g.corrections?.length?'<h3>错误指正与订正</h3><ol>'+g.corrections.map(c=>`<li class="assessment-gap"><strong>${esc(c.location)}</strong><p>错误：${esc(c.issue)}</p><p>订正：${esc(c.correction)}</p></li>`).join('')+'</ol>':g.source==='handwriting'&&!g.needsReview?'<p>本次未发现需要订正的错误。</p>':'';
    const knowledge=g.knowledge?'<h3>关联知识点</h3><ul>'+g.knowledge.map(k=>`<li class="${k.score===null||k.score<80?'assessment-gap':''}"><a href="${esc(linkPrefix+C.knowledgeLink(k.nodeId))}" target="_top">${esc(C.knowledgeNodes[k.nodeId])} →</a> · ${C.knowledgeStatus(k.score)}${k.score===null?'':' · '+k.score+'/100'}<p>${esc(k.feedback)}</p></li>`).join('')+'</ul><p class="muted">知识点评价仅反映本题表现。</p>':'';
    return corrections+knowledge;
  }
  window.GrowingHandwritingAI={request,pageImage,details};
})();
