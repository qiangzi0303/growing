(()=>{
  'use strict';
  const roles={Student:'学生',Parent:'家长',Admin:'管理员'};
  window.GrowingManagement={create(api,esc,alive,relogin=()=>{}){
    let disposed=false,view=0,studentView=0;
    const controller=new AbortController(),valid=()=>!disposed&&alive();
    const date=v=>v?esc(new Date(v).toLocaleString('zh-CN')):'—';
    const amount=e=>e.kind==='cash'?'¥ '+(Number(e.amount)/100).toFixed(2):Number(e.amount)+' 分钟游戏';
    const table=(heads,rows)=>`<div class="table-scroll" tabindex="0"><table><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${heads.length}" class="muted">暂无记录</td></tr>`}</tbody></table></div>`;
    const memberButton=(id,label)=>`<button class="link-button" data-member="${esc(id)}">${esc(label)}</button>`;
    const pager=(data,type)=>`<div class="actions pagination"><button data-${type}-page="${data.page-1}" ${data.page<=1?'disabled':''}>上一页</button><span>第 ${data.page} 页 · 共 ${data.total} 条</span><button data-${type}-page="${data.page+1}" ${data.page*data.pageSize>=data.total?'disabled':''}>下一页</button></div>`;
    function fail(root,e){if(valid()&&root.isConnected)root.innerHTML=`<p class="warning" role="alert">${esc(e.message)}</p>`;}
    function listen(root,type,fn){root.addEventListener(type,fn,{signal:controller.signal});}
    function summary(data){return `<p class="muted">最近同步：${date(data.lastSyncedAt)}</p><div class="cards">${data.subjects.map(s=>`<article class="panel"><span class="badge">${esc(s.subject)}</span><h2>学习记录</h2><span class="metric">${Number(s.mastered)} 项</span><p>已掌握 · 已读/已记录 ${Number(s.read)} 项<br>练习记录 ${Number(s.practice)}<br>有效/活跃时长 ${Number(s.activeMinutes).toFixed(1)} 分钟</p></article>`).join('')}</div><p class="muted">${esc(data.note)}</p>${data.warnings.map(w=>`<p class="warning">${esc(w)}</p>`).join('')}`;}
    function ledgerTable(rows,links){return table(['学生','确认家长（账号）','奖励','单元 / 设备原称呼','设备时间','云端确认时间'],rows.map(r=>`<tr><td>${links?memberButton(r.studentId,r.studentName):esc(r.studentName||'当前学生')}</td><td>${links?memberButton(r.parentId,r.parentName):esc(r.parentName)}<br><small>${esc(r.parentUsername||'')}</small></td><td>${amount(r)}</td><td>${esc(r.documentKey.split(':')[1])}<br><small>${esc(r.claimedParent)}（自填）</small></td><td>${date(r.claimedAt)}</td><td>${date(r.confirmedAt)}</td></tr>`));}
    async function student(root,id,isAdmin=false){
      const request=++studentView;root.innerHTML='<p role="status">正在读取学习情况…</p>';
      const current=()=>valid()&&root.isConnected&&request===studentView;
      try{
        const prefix=isAdmin?'/admin/students/'+id:'/parent/children/'+id;
        const all=isAdmin?await api(prefix+'/report?days=30'):null;
        const [report,growth,rewards]=all?[all.report,all.growth,all.rewards]:await Promise.all([api(prefix+'/report'),api(prefix+'/growth?days=30'),api(prefix+'/rewards')]);
        if(!current())return;
        root.innerHTML=`${all?`<h2>${esc(all.student.displayName)}的学习情况</h2>`:''}${summary(report)}<section class="panel growth"><h2>成长曲线</h2><div class="actions chart-controls"><label>时间范围<select data-days><option value="7">近 7 天</option><option value="30" selected>近 30 天</option><option value="90">近 90 天</option></select></label><label>学科<select data-subject><option>数学</option><option>英语</option><option>物理</option></select></label><label>指标<select data-metric><option value="mastered">已掌握（项）</option><option value="read">已读 / 已记录（项）</option><option value="practice">练习记录（条）</option><option value="minutes">学习时长（分钟）</option></select></label></div><div data-chart></div><p class="muted">${esc(growth.note)}</p></section><section class="panel"><h2>奖励与家长核销</h2><p class="muted">${esc(rewards.note)}</p><div data-rewards></div></section><button data-refresh-report>刷新学习情况</button>`;
        const rankingRoot=document.createElement('section');root.insertBefore(rankingRoot,root.querySelector('.growth'));
        GrowingRankings.mount(rankingRoot,api,esc,current,prefix+'/rankings','孩子的排行榜');
        const handwritingRoot=document.createElement('section');root.append(handwritingRoot);
        GrowingHandwritingView.mount(handwritingRoot,api,esc,current,prefix);
        let chartData=growth,chartRequest=0;
        const draw=()=>{
          const subject=root.querySelector('[data-subject]').value,metric=root.querySelector('[data-metric]').value;
          const label=root.querySelector('[data-metric] option:checked').textContent;
          const points=chartData.points.map(p=>({day:p.day,value:p.subjects.find(s=>s.subject===subject)?.[metric]??null}));
          const max=Math.max(1,...points.map(p=>p.value??0)),left=55,width=800,top=25,height=215;
          const x=i=>left+i*width/Math.max(1,points.length-1),y=v=>top+height-height*v/max;
          let path='',open=false;
          points.forEach((p,i)=>{if(p.value===null){open=false;return;}path+=(open?' L':' M')+x(i).toFixed(1)+' '+y(p.value).toFixed(1);open=true;});
          const chart=root.querySelector('[data-chart]');
          chart.innerHTML=`<p><strong>${esc(subject)} · ${esc(label)}</strong> <small class="muted">空白表示没有快照</small></p><svg class="growth-chart" viewBox="0 0 900 285" role="img" aria-label="${esc(subject+' '+label+'，详细数值见下方表格')}"><line x1="55" x2="855" y1="240" y2="240" stroke="#c5d2c6"/><line x1="55" x2="55" y1="25" y2="240" stroke="#c5d2c6"/><text x="8" y="32">${max.toFixed(1)}</text><text x="30" y="243">0</text><path d="${path}" fill="none" stroke="#38694f" stroke-width="3"/>${points.map((p,i)=>p.value===null?'':`<circle cx="${x(i)}" cy="${y(p.value)}" r="3" fill="#38694f"><title>${p.day}：${p.value}</title></circle>`).join('')}<text x="55" y="272">${points[0]?.day||''}</text><text x="855" y="272" text-anchor="end">${points.at(-1)?.day||''}</text></svg>${points.every(p=>p.value===null)?'<p class="muted">该时间范围尚无成长快照，学生同步后开始积累。</p>':''}<details><summary>查看每日数据（上海时间）</summary>${table(['日期',esc(label)],points.slice().reverse().map(p=>`<tr><td>${p.day}</td><td>${p.value===null?'无快照':Number(p.value).toFixed(metric==='minutes'?1:0)}</td></tr>`))}</details>`;
        };
        const drawRewards=()=>{
          root.querySelector('[data-rewards]').innerHTML=`${rewards.invalid?`<p class="warning">${rewards.invalid} 条格式异常的设备记录未计入明细。</p>`:''}<h3>设备核销记录</h3>${table(['单元','奖励','自填家长称呼','设备记录时间','云端确认'],rewards.entries.map(e=>`<tr><td>${esc(e.unit)}</td><td>${amount(e)}</td><td>${esc(e.claimedParent)}<br><small>身份未经验证</small></td><td>${date(e.claimedAt)}</td><td>${e.confirmation?`${esc(e.confirmation.parentName)}<br>${date(e.confirmation.confirmedAt)}`:isAdmin?'<span class="muted">待家长确认</span>':`<button data-confirm="${esc(e.hash)}">确认已实际兑现</button>`}</td></tr>`))}<details><summary>设备累计核销摘要（包含旧版记录）</summary>${table(['单元','游戏分钟','现金（元）','旧版汇总'],rewards.summaries.map(s=>`<tr><td>${esc(s.unit)}</td><td>${s.paidGame}</td><td>${(s.paidCash/100).toFixed(2)}</td><td>${s.legacy?'包含无身份明细的旧版汇总':'无'}</td></tr>`))}</details><h3>家长云端确认账本</h3><p class="muted">确认后独立留存；设备删除记录不会删除这份账本。以上摘要与确认账本不可相加。</p>${ledgerTable(rewards.confirmations,false)}`;
        };
        draw();drawRewards();
        listen(root,'change',async e=>{
          if(!current())return;
          if(e.target.matches('[data-subject],[data-metric]'))draw();
          if(e.target.matches('[data-days]')){
            const n=++chartRequest,selected=e.target.value;
            root.querySelector('[data-chart]').innerHTML='<p role="status">正在读取曲线…</p>';
            try{const data=await api(prefix+(isAdmin?'/report':'/growth')+'?days='+selected);if(current()&&n===chartRequest){chartData=isAdmin?data.growth:data;draw();}}
            catch(err){if(current()&&n===chartRequest)fail(root.querySelector('[data-chart]'),err);}
          }
        });
        listen(root,'click',async e=>{
          const b=e.target.closest('button');if(!b||!current())return;
          if(b.hasAttribute('data-refresh-report')){await student(root,id,isAdmin);return;}
          if(!b.dataset.confirm)return;
          const entry=rewards.entries.find(r=>r.hash===b.dataset.confirm);
          if(!entry||!confirm('确认这笔 '+amount(entry)+' 已实际兑现？此操作只保存确认账本，不转账、不再次扣除奖励。'))return;
          b.disabled=true;
          try{
            await api(prefix+'/confirm-redemption',{method:'POST',body:JSON.stringify({documentKey:entry.documentKey,hash:entry.hash,confirm:true})});
            const fresh=await api(prefix+'/rewards');if(current()){Object.assign(rewards,fresh);drawRewards();}
          }catch(err){if(current()){b.disabled=false;const p=document.createElement('p');p.className='warning';p.textContent=err.message;b.closest('section').prepend(p);}}
        });
      }catch(e){if(current())fail(root,e);}
    }
    async function admin(root){
      root.innerHTML='<header class="admin-heading"><h1>管理中心</h1><p class="muted">全站会员、学生进步与家长核销确认</p></header><div id="admin-overview" class="cards"></div><nav class="actions admin-tabs" aria-label="管理栏目"><button data-tab="members" class="primary">注册会员</button><button data-tab="ledger">核销确认账本</button></nav><section id="management-body"></section>';
      const body=root.querySelector('#management-body');let query='',role='',memberPage=1,ledgerPage=1,filterStudent='',filterParent='';
      const selected=tab=>{root.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('primary',b.dataset.tab===tab);b.setAttribute('aria-pressed',String(b.dataset.tab===tab));});};
      async function overview(){
        try{const data=await api('/admin/overview');if(!valid())return;
          root.querySelector('#admin-overview').innerHTML=[['注册会员',data.members],['学生 / 家长 / 管理员',`${data.students} / ${data.parents} / ${data.admins}`],['7 天内同步学生',data.syncedThisWeek],['家长确认笔数',data.confirmations],['已确认游戏分钟',data.gameMinutes],['已确认现金（元）',(data.cashCents/100).toFixed(2)]].map(([label,value])=>`<article class="panel stat"><p class="muted">${label}</p><strong class="metric">${value}</strong></article>`).join('');
        }catch(e){fail(root.querySelector('#admin-overview'),e);}
      }
      async function members(){
        const seq=++view;studentView++;selected('members');body.innerHTML='<p role="status">正在查询会员…</p>';
        try{const data=await api('/admin/members?'+new URLSearchParams({q:query,role,page:memberPage}));if(!valid()||seq!==view)return;
          body.innerHTML=`<section class="panel admin-data-panel"><form id="member-search" class="actions filters"><label>用户名或称呼<input name="q" maxlength="40" value="${esc(query)}" placeholder="搜索会员"></label><label>身份<select name="role">${Object.entries({'':'全部身份',...roles}).map(([key,label])=>`<option value="${key}" ${key===role?'selected':''}>${label}</option>`).join('')}</select></label><button type="submit" class="primary">查询</button><button type="button" data-reset-search>重置</button></form><div class="admin-table-heading"><h2>注册会员</h2><span class="muted">共 ${Number(data.total)} 位会员</span></div>${table(['会员','身份','注册时间','最近同步','掌握项数','关联人数'],data.rows.map(m=>`<tr><td>${memberButton(m.id,m.displayName)}<br><small>${esc(m.username)}</small></td><td><span class="badge">${roles[m.role]}</span></td><td>${date(m.createdAt)}</td><td>${date(m.lastSyncedAt)}</td><td>${m.mastered===null?'尚无快照':m.mastered}</td><td>${m.connections}</td></tr>`))}${pager(data,'members')}<p class="muted admin-table-note">掌握项数来自最近一天的三科快照；没有快照时不推算历史。</p></section>`;
        }catch(e){if(seq===view)fail(body,e);}
      }
      async function ledger(){
        const seq=++view;studentView++;selected('ledger');body.innerHTML='<p role="status">正在读取核销账本…</p>';
        try{const data=await api('/admin/redemptions?'+new URLSearchParams({page:ledgerPage,student:filterStudent,parent:filterParent}));if(!valid()||seq!==view)return;
          body.innerHTML=`<section class="panel"><h2>家长核销确认账本</h2><p class="muted">仅统计已登录并绑定的家长确认。未经确认的设备记录请进入学生详情查看。</p>${filterStudent||filterParent?'<p>当前按所选会员筛选 <button data-clear-filter>查看全站账本</button></p>':''}${ledgerTable(data.rows,true)}${pager(data,'ledger')}</section>`;
        }catch(e){if(seq===view)fail(body,e);}
      }
      async function member(id){
        const seq=++view;studentView++;body.innerHTML='<p role="status">正在读取会员详情…</p>';
        try{const data=await api('/admin/members/'+id);if(!valid()||seq!==view)return;
          const m=data.member,relations=m.role==='Student'?data.parents:data.children;
          body.innerHTML=`<section class="panel"><button data-back>← 返回会员列表</button><h2>${esc(m.displayName)} <span class="badge">${roles[m.role]}</span></h2><p>${esc(m.username)} · 注册于 ${date(m.createdAt)}</p><h3>${m.role==='Student'?'关联家长':'关联学生'}</h3><div class="actions">${relations.map(c=>memberButton(c.id,c.displayName)).join('')||'<span class="muted">尚无关联</span>'}</div><p><button data-member-ledger="${m.id}" data-role="${m.role}">查看此会员的核销确认账本</button></p></section><section class="panel"><h2>修改会员密码</h2><p>正在修改 <strong>${esc(m.displayName)}（${esc(m.username)}）</strong> 的登录密码。保存后，该会员需要在各设备重新登录；学习记录、奖励和账号关联保留。</p><form id="member-password" data-member-id="${esc(m.id)}"><label>新密码<input name="newPassword" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><label>确认新密码<input name="confirmPassword" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><button type="submit" class="primary">保存新密码</button><p data-password-status role="status" aria-live="polite"></p></form></section><section id="member-learning"></section>`;
          if(m.role==='Student')await student(body.querySelector('#member-learning'),id,true);
          else body.querySelector('#member-learning').innerHTML=`<section class="panel"><h2>最近家长确认记录</h2>${ledgerTable(data.confirmations.rows,true)}${data.confirmations.total>20?'<p class="muted">更多记录请查看此会员的核销确认账本。</p>':''}</section>`;
        }catch(e){if(seq===view)fail(body,e);}
      }
      listen(root,'submit',async e=>{
        if(e.target.id==='member-password'){
          e.preventDefault();const form=e.target;if(!valid()||form.dataset.busy)return;
          const status=form.querySelector('[data-password-status]'),button=form.querySelector('button[type=submit]'),data=Object.fromEntries(new FormData(form));
          if(data.newPassword.length<8||data.newPassword.length>128||!data.newPassword.trim()){status.textContent='请输入 8—128 位且非全空白的新密码。';return;}
          if(data.newPassword!==data.confirmPassword){status.textContent='两次输入的新密码不一致。';return;}
          const seq=view;form.dataset.busy='true';button.disabled=true;button.textContent='正在保存…';form.querySelectorAll('input').forEach(i=>i.disabled=true);status.className='';status.textContent='正在修改密码…';
          try{
            const result=await api('/admin/members/'+encodeURIComponent(form.dataset.memberId)+'/password',{method:'POST',body:JSON.stringify(data)});
            if(!valid())return;
            if(result.reauthenticate){relogin();return;}
            if(seq===view&&form.isConnected){form.reset();status.textContent='密码已修改，该会员请使用新密码重新登录。';}
          }catch(error){if(valid()&&seq===view&&form.isConnected){status.className='warning';status.textContent='未能确认修改结果：'+error.message+'。请保留当前页面，检查后重试。';}}
          finally{if(form.isConnected){delete form.dataset.busy;button.disabled=false;button.textContent='保存新密码';form.querySelectorAll('input').forEach(i=>i.disabled=false);}}
          return;
        }
        if(e.target.id!=='member-search')return;e.preventDefault();const data=new FormData(e.target);query=String(data.get('q')).trim();role=String(data.get('role'));memberPage=1;members();
      });
      listen(root,'click',e=>{const b=e.target.closest('button');if(!b||!valid())return;
        if(b.hasAttribute('data-reset-search')){query='';role='';memberPage=1;members();}
        if(b.dataset.tab==='members'||b.hasAttribute('data-back'))members();
        if(b.dataset.tab==='ledger'){filterStudent='';filterParent='';ledgerPage=1;ledger();overview();}
        if(b.dataset.member)member(b.dataset.member);
        if(b.dataset.membersPage){memberPage=Number(b.dataset.membersPage);members();}
        if(b.dataset.ledgerPage){ledgerPage=Number(b.dataset.ledgerPage);ledger();}
        if(b.hasAttribute('data-clear-filter')){filterStudent='';filterParent='';ledgerPage=1;ledger();}
        if(b.dataset.memberLedger){filterStudent=b.dataset.role==='Student'?b.dataset.memberLedger:'';filterParent=b.dataset.role==='Student'?'':b.dataset.memberLedger;ledgerPage=1;ledger();}
      });
      await Promise.all([overview(),members()]);
    }
    return {admin,student,dispose(){disposed=true;view++;studentView++;controller.abort();}};
  }};
})();
