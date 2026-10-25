/* Per-student, append-only attempt records. Each explicit practice uses one stable ID. */
(()=>{
  'use strict';
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stamp=at=>new Date(at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'});
  window.GrowingQuestionAttempts={
    async context(){
      if(window.top.GrowingCloud?.questionAttempts)return window.top.GrowingCloud.questionAttempts();
      if(!window.GrowingNative)return null;
      const base=String(GrowingNative.cloudApiUrl?.()||'').replace(/\/$/,'');
      const session=JSON.parse(localStorage.getItem('growing-cloud-session-v1')||'null');
      if(!base||!session?.token||session.user?.role!=='Student'||localStorage.getItem('growing-cloud-binding-v1')!==session.user.id)return null;
      return {studentId:session.user.id,api:async(path,options={})=>{
        const current=JSON.parse(localStorage.getItem('growing-cloud-session-v1')||'null');
        if(current?.token!==session.token||current.user?.id!==session.user.id)throw Error('账号已切换，请重新打开错题。');
        const response=await fetch(base+'/api'+path,{...options,signal:AbortSignal.timeout(12000),credentials:'omit',headers:{'Content-Type':'application/json','X-Growing-Client':'1',Authorization:'Bearer '+session.token}});
        const result=await response.json();if(!response.ok)throw Error(result.error||'记录未保存，请重试。');return result;
      }};
    },
    create(root,api,studentId,alive=()=>true,onChange=()=>{}){
      let disposed=false;const valid=()=>!disposed&&root.isConnected&&alive();
      const stats=new Map(),states=new Map(),loaded=new Set(),loadErrors=new Map();
      const key=(kind,id)=>kind+':'+id;
      function state(k){
        if(!states.has(k)){
          const s={pending:null,busy:false,message:'',history:null,historyPage:1};
          try{const raw=sessionStorage.getItem('growing-attempt-pending:'+studentId+':'+k);if(raw){const p=JSON.parse(raw);if(!p||typeof p.id!=='string'||!/^[a-f0-9-]{36}$/i.test(p.id)||(p.correct!==null&&typeof p.correct!=='boolean'))throw Error('格式无效');s.pending=p;}}
          catch(_){s.blocked=true;s.message='本次练习草稿无法读取，请恢复浏览器存储后重新打开。';}
          states.set(k,s);
        }return states.get(k);
      }
      const get=(kind,id)=>stats.get(key(kind,id))||{totalCount:0,wrongCount:0,correctCount:0,lastAt:null};
      function content(kind,id){
        const k=key(kind,id),s=state(k),v=get(kind,id),ready=loaded.has(kind),disabled=s.busy||!ready||s.blocked;
        const action=(name,text)=>`<button type="button" data-attempt-action="${name}" ${disabled?'disabled':''}>${text}</button>`;
        return `<p class="attempt-count ${v.wrongCount>=2?'attempt-repeat':''}">${ready?`累计做错 <strong>${v.wrongCount}</strong> 次 · 做对 ${v.correctCount} 次 · 共 ${v.totalCount} 次${v.wrongCount>=2?' · 反复错题（≥2次）':''}`:esc(loadErrors.get(kind)||'正在读取作答统计…')}</p>${v.lastAt?`<p class="attempt-meta">最近记录：${esc(stamp(v.lastAt))}（北京时间）</p>`:''}<p class="attempt-meta">独立作答并核对后，记录本次对错。</p><div class="attempt-actions">${!s.pending?action('start',s.message?'再练一次':'开始本次练习'):s.pending.correct===null?action('wrong','本次做错')+action('correct','本次做对')+action('cancel','取消本次练习'):action('retry',s.busy?'正在保存…':'重试保存本次结果')}${action('history','查看作答记录')}</div><p role="status" class="attempt-status">${esc(s.message)}</p>${s.history?`<div class="attempt-history"><p>作答记录 · 第 ${s.history.page} 页（北京时间）</p><ol>${s.history.rows.map(r=>`<li>${esc(stamp(r.at))} · ${r.correct?'做对':'做错'}</li>`).join('')||'<li>尚无作答记录。</li>'}</ol><div class="attempt-actions">${s.history.page>1?action('history-prev','上一页'):''}${s.history.page*20<s.history.totalCount?action('history-next','下一页'):''}</div></div>`:''}`;
      }
      function markup(kind,id){return `<section class="question-attempt" data-attempt-key="${esc(key(kind,id))}" aria-label="作答与错误次数">${content(kind,id)}</section>`;}
      function paint(kind,id){if(!valid())return;const k=key(kind,id);for(const el of root.querySelectorAll('[data-attempt-key]'))if(el.dataset.attemptKey===k)el.innerHTML=content(kind,id);}
      function persist(k,pending){const name='growing-attempt-pending:'+studentId+':'+k;if(pending)sessionStorage.setItem(name,JSON.stringify(pending));else sessionStorage.removeItem(name);}
      async function load(kind){
        loaded.delete(kind);loadErrors.delete(kind);
        try{const rows=await api('/question-bank/attempt-stats?'+new URLSearchParams({studentId,kind}));if(!valid())return;
          for(const k of stats.keys())if(k.startsWith(kind+':'))stats.delete(k);
          for(const row of rows)stats.set(key(kind,row.questionId),row);loaded.add(kind);
        }catch(e){if(valid())loadErrors.set(kind,'统计读取失败：'+e.message);}
        if(valid())for(const el of root.querySelectorAll('[data-attempt-key]')){const [type,id]=el.dataset.attemptKey.split(':');if(type===kind)paint(type,id);}
      }
      async function handle(event){
        const button=event.target.closest('[data-attempt-action]'),panel=button?.closest('[data-attempt-key]');if(!panel||!root.contains(panel)||!valid())return;
        const [kind,id]=panel.dataset.attemptKey.split(':'),k=key(kind,id),s=state(k),action=button.dataset.attemptAction;
        if(s.busy||s.blocked||!loaded.has(kind))return;
        try{
          if(action==='start'){const p={id:crypto.randomUUID(),correct:null};persist(k,p);s.pending=p;s.message='请独立作答，核对答案后选择本次结果。';}
          else if(action==='cancel'){persist(k,null);s.pending=null;s.message='已取消，本次没有计入统计。';}
          else if(['correct','wrong','retry'].includes(action)){
            if(!s.pending)return;
            if(s.pending.correct===null){if(action==='retry')return;const p={...s.pending,correct:action==='correct'};persist(k,p);s.pending=p;}
            s.busy=true;s.message='正在保存本次结果…';paint(kind,id);
            const result=await api('/question-bank/attempts',{method:'POST',body:JSON.stringify({studentId,kind,questionId:id,attemptId:s.pending.id,correct:s.pending.correct})});
            if(!valid())return;stats.set(k,result);s.history=s.history?result:null;
            persist(k,null);s.pending=null;s.message='本次结果已保存。再次练习请点击“再练一次”。';s.busy=false;paint(kind,id);onChange();return;
          }else if(action.startsWith('history')){
            const page=action==='history-next'?(s.history?.page||1)+1:action==='history-prev'?Math.max(1,(s.history?.page||1)-1):1;
            s.busy=true;paint(kind,id);const result=await api('/question-bank/attempts?'+new URLSearchParams({studentId,kind,questionId:id,page}));
            if(!valid())return;s.history=result;stats.set(k,result);
          }
        }catch(e){s.message='未完成：'+e.message+'；本次结果保留，可重试。';}
        finally{s.busy=false;paint(kind,id);}
      }
      root.addEventListener('click',handle);
      return {load,get,markup,ready:kind=>loaded.has(kind),dispose(){disposed=true;root.removeEventListener('click',handle);}};
    }
  };
})();
