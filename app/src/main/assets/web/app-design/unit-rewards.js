/* One ledger per curriculum unit. Course providers expose counts, never AI configuration. */
(()=>{
  'use strict';
  const E=window.GrowingRewards,providers=new Map(),prefix='growing-unit-rewards-v1:';
  let dialog,opener;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=c=>(c/100).toFixed(2).replace(/\.00$/,'');
  const percent=n=>Math.floor(n*1000+1e-8)/10;
  function load(id){const raw=localStorage.getItem(prefix+id);return E.restore(raw?JSON.parse(raw):null,providers.get(id)?.legacy?.());}
  function persist(id,d){localStorage.setItem(prefix+id,JSON.stringify(d));}
  function current(id){const p=providers.get(id);if(p.readOnly)return load(id);const s=p.progress();return E.accrue(load(id),s.done,s.total);}
  function summary(id,d){
    const p=providers.get(id),a=E.amounts(d),ratio=d.total?d.done/d.total:0;
    const row=(name,earned,paid,available,unit)=>`<div class="unit-reward-amount"><h3>${name}</h3><strong>已获得 ${earned}${unit}</strong><p>已核销 ${paid}${unit} · 可核销 <b>${available}${unit}</b></p></div>`;
    return `<div class="unit-reward-heading"><div><span>本单元奖励 · ${esc(p.title)}</span><h2>掌握多少，获得多少</h2></div><strong>${percent(ratio)}%</strong></div><progress max="100" value="${ratio*100}" aria-label="本单元掌握进度">${percent(ratio)}%</progress><p class="unit-reward-rule">${d.total?`已完成 ${d.done}/${d.total} 项。`:'暂无正式掌握记录，暂不累计掌握进度。'}${esc(p.rule)}<br>奖励总额：${d.config.gameMinutes}分钟游戏 ＋ ${money(Math.round(d.config.cashYuan*100))}元红包，按实际比例计算，游戏向下取整到分钟、红包到分。</p><div class="unit-reward-grid">${row('游戏时间',a.game,d.paidGame,a.availableGame,'分钟')}${row('红包',money(a.cash),money(d.paidCash),money(a.availableCash),'元')}</div>${d.peak>ratio?'<p class="unit-reward-rule">曾获得的奖励已保留；重学或重置进度不会重复获得同一份额度，超过历史进度后继续累积。</p>':''}${!d.config.enabled?'<p class="unit-reward-rule">奖励累计已暂停，已获得额度保留。</p>':''}`;
  }
  function render(el,id){
    if(!providers.has(id)||el.dataset.rewardMounted)return;
    el.dataset.rewardMounted='true';el.classList.add('unit-rewards');
    try{
      const d=current(id),p=providers.get(id);if(!p.readOnly)persist(id,d);
      if(p.readOnly){el.innerHTML=`<div class="unit-reward-summary">${summary(id,d)}</div><p class="unit-reward-rule">目录显示最近保存的记录。<a href="${esc(p.entry)}">进入单元同步进度、设置奖励或家长核销 →</a></p>`;return;}
      el.innerHTML=`<div class="unit-reward-summary">${summary(id,d)}</div><details class="unit-reward-settings"><summary>奖励总额设置 / 家长核销</summary><fieldset><legend>本单元奖励总额</legend><label>游戏时间（分钟）<input data-reward-field="game" type="number" min="0" max="600000" step="1" value="${d.config.gameMinutes}"></label><label>红包（元）<input data-reward-field="cash" type="number" min="0" max="100000" step="0.01" value="${d.config.cashYuan}"></label><label class="unit-reward-check"><input data-reward-field="enabled" type="checkbox" ${d.config.enabled?'checked':''}>启用奖励累计</label><button type="button" data-reward-action="save">保存本单元奖励</button><p>首次核销后固定总额。各单元独立设置，默认120分钟、200元。</p></fieldset><div class="unit-reward-parent"><label>核销家长称呼<input data-reward-field="parent" maxlength="30" placeholder="例如：妈妈"></label><label class="unit-reward-check"><input data-reward-field="confirm" type="checkbox">我是家长，确认已实际兑现本次额度</label><div class="unit-reward-buttons"><button type="button" data-reward-action="game">核销当前可领游戏时间</button><button type="button" data-reward-action="cash">核销当前可领红包</button></div><p>每次只核销尚未兑现的额度。本页只记账，不转账或控制游戏时长；家长确认不提供身份验证。</p><div class="unit-reward-history"></div></div></details><p class="unit-reward-status" role="status" aria-live="polite"></p>`;
      refresh(el,id,d);
    }catch(e){el.innerHTML='<p role="status">奖励记录暂不可用：'+esc(e.message)+' 请允许本地存储后刷新；原记录未删除。</p>';}
  }
  function refresh(el,id,d){
    if(!el.querySelector('.unit-reward-summary'))return;
    el.querySelector('.unit-reward-summary').innerHTML=summary(id,d);
    if(providers.get(id).readOnly)return;
    const a=E.amounts(d),locked=E.locked(d);
    for(const x of el.querySelectorAll('fieldset input,fieldset button'))x.disabled=locked;
    el.querySelector('[data-reward-action=game]').disabled=!a.availableGame;
    el.querySelector('[data-reward-action=cash]').disabled=!a.availableCash;
    el.querySelector('.unit-reward-history').innerHTML=d.history.length?`<details><summary>核销记录（${d.history.length}）</summary>${d.history.map(h=>h.legacy?'<p>已承接旧版整单元奖励及核销状态。</p>':`<p>${esc(new Date(h.at).toLocaleString('zh-CN'))} · ${esc(h.parent)} · ${h.kind==='game'?h.amount+'分钟游戏':money(h.amount)+'元红包'}</p>`).join('')}</details>`:'';
  }
  function update(id){
    if(!providers.has(id))return;
    try{const d=current(id);if(!providers.get(id).readOnly)persist(id,d);for(const el of document.querySelectorAll('[data-unit-reward]'))if(el.dataset.unitReward===id)refresh(el,id,d);}
    catch(e){for(const el of document.querySelectorAll('[data-unit-reward]'))if(el.dataset.unitReward===id){const status=el.querySelector('.unit-reward-status');if(status)status.textContent='奖励未保存：'+e.message;}}
  }
  function scan(){for(const el of document.querySelectorAll('[data-unit-reward]'))render(el,el.dataset.unitReward);}
  function register(id,p){providers.set(id,p);scan();update(id);}
  const placeholder=id=>`<button type="button" class="unit-reward-trigger" data-reward-open="${esc(id)}" aria-haspopup="dialog" aria-label="查看${esc(providers.get(id)?.title||'本单元')}掌握程度">查看掌握程度</button>`;
  function open(id,button){
    if(!providers.has(id))return;
    if(!dialog){
      dialog=document.createElement('dialog');dialog.className='unit-reward-dialog';
      dialog.setAttribute('aria-labelledby','unit-reward-dialog-title');
      dialog.addEventListener('keydown',e=>{
        if(e.key!=='Tab')return;
        const controls=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),summary')].filter(el=>el.getClientRects().length);
        const first=controls[0],last=controls.at(-1);
        if(first&&((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last))){e.preventDefault();(e.shiftKey?last:first).focus();}
      });
      dialog.addEventListener('close',()=>{document.documentElement.classList.remove('unit-reward-modal-open');if(opener?.isConnected)opener.focus();});
      dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
      document.body.append(dialog);
    }
    opener=button;
    dialog.innerHTML=`<header class="unit-reward-dialog-bar"><h2 id="unit-reward-dialog-title">${esc(providers.get(id).title)} · 掌握程度</h2><button type="button" data-reward-close autofocus aria-label="关闭掌握程度">关闭 ×</button></header><section data-unit-reward="${esc(id)}" aria-label="本单元进度与奖励"></section>`;
    render(dialog.querySelector('[data-unit-reward]'),id);
    if(!dialog.open)dialog.showModal();
    document.documentElement.classList.add('unit-reward-modal-open');
  }
  document.addEventListener('click',e=>{
    const trigger=e.target.closest('[data-reward-open]');
    if(trigger){e.preventDefault();open(trigger.dataset.rewardOpen,trigger);return;}
    if(e.target.closest('[data-reward-close]')){dialog?.close();return;}
    const b=e.target.closest('[data-reward-action]');if(!b||b.disabled)return;
    e.preventDefault();const el=b.closest('[data-unit-reward]'),id=el.dataset.unitReward,status=el.querySelector('.unit-reward-status');
    const field=k=>el.querySelector('[data-reward-field='+k+']');
    try{
      let d=current(id);
      if(b.dataset.rewardAction==='save'){
        if(!field('game').value.trim()||!field('cash').value.trim())throw Error('请填写游戏时间和红包总额。');
        d=E.accrue(E.configure(d,Number(field('game').value),Number(field('cash').value),field('enabled').checked),d.done,d.total);
      }else{
        if(!field('confirm').checked)throw Error('请由家长勾选确认已实际兑现。');
        d=E.redeem(d,b.dataset.rewardAction,field('parent').value);
      }
      persist(id,d); // Commit before showing success; a failed write never consumes a reward.
      for(const other of document.querySelectorAll('[data-unit-reward]'))if(other.dataset.unitReward===id)refresh(other,id,d);
      if(b.dataset.rewardAction!=='save')field('confirm').checked=false;
      status.textContent=b.dataset.rewardAction==='save'?'本单元奖励总额已保存。':'本次核销已保存，只扣除当前可领额度。';
    }catch(error){status.textContent='未完成：'+error.message;}
  });
  window.addEventListener('storage',e=>{if(e.key?.startsWith(prefix)){const id=e.key.slice(prefix.length);if(providers.has(id)){try{const d=load(id);for(const el of document.querySelectorAll('[data-unit-reward]'))if(el.dataset.unitReward===id)refresh(el,id,d);}catch{}}}});
  // Observe course re-renders, not our own numeric/text updates.
  new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('[data-unit-reward]:not([data-reward-mounted])')||n.querySelector?.('[data-unit-reward]:not([data-reward-mounted])')))))scan();}).observe(document.documentElement,{childList:true,subtree:true});
  window.UnitRewards={register,placeholder,update};
})();
