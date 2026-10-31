/* Read-only originals, fetched only after the server checks the parent/child binding. */
window.GrowingHandwritingView={mount(root,api,esc,current,prefix){
  let page=1,sequence=0;
  root.className='panel handwriting-records';
  async function list(){
    const seq=++sequence;root.innerHTML='<h2>孩子的手写作业</h2><p role="status">正在读取原稿…</p>';
    try{const data=await api(prefix+'/handwriting?page='+page);if(!current()||seq!==sequence)return;
      root.innerHTML=`<h2>孩子的手写作业</h2><p class="muted">AI 点评为辅助参考，手写成绩暂不计入排行榜。</p><div class="cards">${data.rows.map(r=>`<article><h3>${esc(r.title||'未命名作业')}</h3><p>${esc(r.unitId)} · ${Number(r.pages)} 页<br>${r.grade?r.grade.needsReview?'需要复核':r.grade.score+' / 100':'尚无当前原稿点评'}</p><button data-original="${esc(r.key)}">查看原稿与点评</button></article>`).join('')||'<p>尚无手写作业。</p>'}</div><div class="actions"><button data-hw-prev ${page===1?'disabled':''}>上一页</button><span>第 ${page} 页 · ${data.total} 份</span><button data-hw-next ${page*data.pageSize>=data.total?'disabled':''}>下一页</button></div>`;
    }catch{if(current()&&seq===sequence)root.innerHTML='<h2>孩子的手写作业</h2><p class="warning">暂时无法读取手写作业，请刷新学习情况后重试。</p>';}
  }
  async function show(key){
    const seq=++sequence;root.innerHTML='<p role="status">正在读取原稿…</p>';
    try{const data=await api(prefix+'/handwriting?key='+encodeURIComponent(key));if(!current()||seq!==sequence)return;
      const d=data.original;if(!GrowingHandwriting.validate(d))throw Error();
      root.innerHTML=`<button data-hw-back>← 返回手写作业</button><h2>手写原稿</h2><p style="white-space:pre-wrap">${esc(d.prompt)}</p><div data-original-pages></div>${d.recognition?`<details><summary>核对文字${d.recognition.confirmed?'（学生已确认）':'（尚未确认）'}</summary><p style="white-space:pre-wrap">${esc(d.recognition.text)}</p></details>`:''}<h3>AI 点评</h3>${d.grades.slice().reverse().map(g=>`<article><h4>${g.revision===d.revision?'当前原稿点评':'历史点评（原稿已修改）'} · ${g.needsReview?'需要复核 / 无分数':g.score+' / 100'}</h4><p>${g.source==='handwriting'?'AI 直接查看手写原稿':'历史文字点评'}</p><p style="white-space:pre-wrap">${esc(g.feedback)}</p>${g.corrections?.length?'<h4>错误指正与订正</h4><ol>'+g.corrections.map(c=>`<li><strong>${esc(c.location)}</strong><p>错误：${esc(c.issue)}</p><p>订正：${esc(c.correction)}</p></li>`).join('')+'</ol>':''}</article>`).join('')||'<p>尚无 AI 点评。</p>'}`;
      d.grades.slice().reverse().forEach((g,i)=>{
        if(!g.knowledge)return;
        const article=root.querySelectorAll('article')[i];
        article.insertAdjacentHTML('beforeend','<h4>考核知识点</h4><ul>'+g.knowledge.map(k=>'<li><a href="'+esc('/learn/app-design/'+GrowingHandwriting.knowledgeLink(k.nodeId))+'">'+esc(GrowingHandwriting.knowledgeNodes[k.nodeId])+'</a>'+' · '+GrowingHandwriting.knowledgeStatus(k.score)+(k.score===null?'':' · '+k.score+'/100')+'<p>'+esc(k.feedback)+'</p></li>').join('')+'</ul>');
      });
      const pages=root.querySelector('[data-original-pages]');d.pages.forEach((strokes,i)=>{const label=document.createElement('p');label.textContent='第 '+(i+1)+' 页';const canvas=document.createElement('canvas');canvas.width=800;canvas.height=1100;canvas.style.cssText='width:100%;max-width:800px;height:auto;border:1px solid #d8e0d9;background:white;display:block';canvas.setAttribute('aria-label','第 '+(i+1)+' 页手写原稿');pages.append(label,canvas);GrowingHandwriting.draw(canvas,strokes);});
    }catch{if(current()&&seq===sequence)root.innerHTML='<p class="warning">无法读取该原稿，或家长绑定已失效。</p><button data-hw-back>返回作业列表</button>';}
  }
  root.addEventListener('click',e=>{if(!current())return;const b=e.target.closest('button');if(!b)return;if(b.dataset.original)show(b.dataset.original);else if(b.hasAttribute('data-hw-back'))list();else if(b.hasAttribute('data-hw-prev')){page=Math.max(1,page-1);list();}else if(b.hasAttribute('data-hw-next')){page++;list();}});
  list();
}};
