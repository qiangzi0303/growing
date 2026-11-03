/* Examinations use the same persisted review records as photographed papers. */
(()=>{
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function context(){
    if(window.top.GrowingCloud?.paperReviewContext)return window.top.GrowingCloud.paperReviewContext();
    const api=async(path,options={})=>{
      const response=await fetch('/api'+path,{...options,credentials:'same-origin',headers:{'Content-Type':'application/json','X-Growing-Client':'1'}});
      const data=await response.json();if(!response.ok)throw Error(data.error||'请先登录后再批改试卷。');return data;
    };
    return {user:await api('/auth/me'),api};
  }
  async function student(session){
    if(session.user.role==='Student')return session.user.id;
    const admin=session.user.role==='Admin';
    if(!admin&&session.user.role!=='Parent')throw Error('请先选择学生身份。');
    const children=admin?(await session.api('/admin/members?role=Student&page=1')).rows:await session.api('/parent/children');
    if(!children.length)throw Error('请先关联孩子后再批改。');
    return new Promise((resolve,reject)=>{
      const d=document.createElement('dialog');d.className='paper-student-dialog';
      d.innerHTML='<form method="dialog"><label>试卷所属孩子<select>'+children.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.displayName)+'</option>').join('')+'</select></label><div class="actions"><button value="open">打开批改</button><button value="cancel">取消</button></div></form>';
      if(admin){
        const search=document.createElement('form');search.innerHTML='<label>搜索学生<input name="q" maxlength="40"></label><button>查询</button><p role="status"></p>';d.prepend(search);
        search.onsubmit=async e=>{e.preventDefault();const b=search.querySelector('button');b.disabled=true;try{const data=await session.api('/admin/members?'+new URLSearchParams({role:'Student',q:new FormData(search).get('q'),page:'1'}));d.querySelector('select').innerHTML=data.rows.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.displayName)+'（'+esc(c.username)+'）</option>').join('');d.querySelector('[value=open]').disabled=!data.rows.length;search.querySelector('[role=status]').textContent=data.rows.length?'':'未找到学生。';}catch(error){search.querySelector('[role=status]').textContent=error.message;}finally{b.disabled=false;}};
      }
      d.addEventListener('close',()=>{const id=d.querySelector('select').value;d.remove();d.returnValue==='open'?resolve(id):reject(Error('尚未选择孩子，作答已保留。'));},{once:true});document.body.append(d);d.showModal();
    });
  }
  function vector(card){
    const figures=[...card.querySelectorAll('svg')].filter(s=>!s.closest('.katex')).map(svg=>{
      const box=svg.viewBox.baseVal;
      if(box.x||box.y||!box.width||!box.height||svg.querySelector('[transform]'))throw Error('题图坐标需要核对，请从“我的试卷”打开。');
      const fields={path:['d'],line:['x1','y1','x2','y2'],circle:['cx','cy','r'],ellipse:['cx','cy','rx','ry'],rect:['x','y','width','height'],text:['x','y','text'],polygon:['points'],polyline:['points']};
      const elements=[];
      function walk(parent,inherited={}){for(const node of parent.children){
        const styles={...inherited};for(const key of ['stroke','fill','stroke-width','font-size','text-anchor','stroke-dasharray'])if(node.hasAttribute(key))styles[key]=node.getAttribute(key);
        const tag=node.localName;if(tag==='g'){walk(node,styles);continue;}if(tag==='title'||tag==='desc')continue;
        if(!fields[tag])throw Error('题图包含尚未支持的标记，请先核对。');
        if(tag==='rect'&&node.getAttribute('width')==='100%')continue;
        const element={tag};for(const k of fields[tag])element[k]=k==='text'?node.textContent:k==='d'?node.getAttribute(k):k==='points'?(node.getAttribute(k)||'').trim().split(/[\s,]+/).map(Number):Number(node.getAttribute(k)||0);
        for(const key of ['stroke','fill'])if(styles[key])element[key]=styles[key]==='currentColor'?'#17212b':styles[key];
        if(styles['stroke-width'])element.strokeWidth=Number(styles['stroke-width']);
        if(styles['font-size'])element.fontSize=Number(styles['font-size']);
        if(styles['text-anchor'])element.anchor=styles['text-anchor'];
        if(styles['stroke-dasharray'])element.dashed=true;
        elements.push(element);
      }}
      walk(svg);return {width:box.width,height:box.height,title:svg.getAttribute('aria-label')||'题设图',elements};
    });
    if(!figures.length)return null;
    const result=GrowingQuestionDrawing.normalize({version:'question-svg-v1',figures,warnings:[]});
    if(!result)throw Error('题图未通过校验，原题已保留。');return result;
  }
  window.GrowingExamReview={vector,mount(root,options){
    let controller=null,disposed=false,busy=false,session=null;
    const message=document.createElement('p');message.setAttribute('role','status');root.before(message);
    const cards=new Map(options.questions.map(q=>[String(q.number),options.cardFor(q)]));
    for(const [number,card] of cards){if(!card)continue;const b=document.createElement('button');b.type='button';b.className='paper-review-toggle';b.dataset.examReview=number;b.textContent='此题批改';card.append(b);}
    const valid=()=>!disposed&&root.isConnected;
    async function click(event){
      const b=event.target.closest('[data-exam-review]');if(!b||busy||!valid())return;
      const number=b.dataset.examReview;busy=true;root.querySelectorAll('[data-exam-review]').forEach(b=>b.disabled=true);message.textContent='正在打开批改…';
      try{
        session=await context();const studentId=await student(session);
        if(options.studentId&&options.studentId!==studentId)throw Error('本次作答属于另一个孩子，请切回对应账号。');
        const questions=options.questions.map(q=>({...q,drawing:vector(cards.get(String(q.number)))}));
        const paper=await session.api('/question-bank/exams',{method:'POST',body:JSON.stringify({studentId,sourceId:options.sourceId,submissionId:options.submissionId,title:options.title,questions})});
        if(!valid())return;
        options.onRegistered?.(studentId,paper.id);
        root.querySelectorAll('[data-exam-review]').forEach(b=>b.remove());root.removeEventListener('click',click);message.textContent='';
        controller=GrowingPaperReview.mount(root,session.api,esc,valid,studentId,paper,q=>cards.get(String(q.number)));
        const q=paper.questions.find(q=>String(q.number)===number);if(q)cards.get(number).querySelector('[data-review-open="'+q.id+'"]').click();
      }catch(error){if(valid())message.textContent=error.message+' 原作答已保留，可再次点击重试。';}
      finally{busy=false;if(valid())root.querySelectorAll('[data-exam-review]').forEach(b=>b.disabled=false);}
    }
    root.addEventListener('click',click);
    const dispose=()=>{if(disposed)return;disposed=true;controller?.dispose();root.removeEventListener('click',click);root.querySelectorAll('[data-exam-review]').forEach(b=>b.remove());message.remove();window.removeEventListener('pagehide',dispose);};
    window.addEventListener('pagehide',dispose,{once:true});return {dispose};
  }};
})();
