/* Shared by the old shell and the console; navigation is never authorization. */
(()=>{
  const actions=['question-bank','my-papers','settings','voice-settings','classroom'];
  const validId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value);
  const validReturn=value=>typeof value==='string'&&/^\/console\/(?:home|students(?:\/[A-Za-z0-9_-]{1,100})?|reports|members(?:\/[A-Za-z0-9_-]{1,100})?|rewards|account)?$/.test(value);
  function parse(search,hash){
    const query=new URLSearchParams(search),result={legacy:query.get('legacy')==='1',register:hash==='#register',returnTo:'/console/home'};
    for(const key of ['legacy','action','student','paper','return'])if(query.getAll(key).length>1)return {...result,error:'兼容入口参数无效。'};
    if(query.has('legacy')&&!result.legacy)return {...result,error:'兼容入口参数无效。'};
    result.action=query.has('action')?query.get('action'):({'#question-bank':'question-bank','#my-papers':'my-papers','#learning-reports':'reports'}[hash]);
    if(query.has('action')&&!actions.includes(result.action))return {...result,error:'兼容入口参数无效。'};
    for(const [key,name] of [['student','studentId'],['paper','paperId']])if(query.has(key)){
      if(!validId(query.get(key)))return {...result,error:'学生或试卷参数无效。'};
      result[name]=query.get(key);
    }
    if(query.has('paper')&&(result.action!=='my-papers'||!result.studentId))return {...result,error:'试卷必须指定学生。'};
    if(query.has('return')){if(!validReturn(query.get('return')))return {...result,error:'返回地址无效。'};result.returnTo=query.get('return');}
    return result;
  }
  function link(action,returnTo='/console/home',studentId,paperId){
    if(!actions.includes(action)||!validReturn(returnTo)||studentId!==undefined&&!validId(studentId)||paperId!==undefined&&(!validId(paperId)||!studentId||action!=='my-papers'))throw Error('兼容入口参数无效。');
    const q=new URLSearchParams({legacy:'1',action,return:returnTo});if(studentId!==undefined)q.set('student',studentId);if(paperId!==undefined)q.set('paper',paperId);
    return '/?'+q+(action==='question-bank'||action==='my-papers'?'#'+action:'');
  }
  function destination(profile,native,context){
    if(native||context.error||context.legacy&&!context.register||!['Admin','Parent'].includes(profile.role)||profile.role!=='Admin'&&profile.roleSelectionRequired!==false)return null;
    if(['question-bank','my-papers'].includes(context.action))return link(context.action,context.returnTo,context.studentId,context.paperId);
    return context.action==='reports'?'/console/reports':'/console/home';
  }
  async function target(children,user,api,context){
    if(!Object.prototype.hasOwnProperty.call(context,'studentId'))return user.role==='Student'?user.id:children[0]?.id||'';
    if(!validId(context.studentId))throw Error('学生参数无效。');
    if(user.role==='Student'){if(context.studentId!==user.id)throw Error('无权查看此学生。');return user.id;}
    if(!children.some(c=>c.id===context.studentId)){
      if(user.role!=='Admin')throw Error('未找到关联孩子。');
      const result=await api('/admin/members/'+encodeURIComponent(context.studentId));
      if(result.member?.role!=='Student'||result.member.id!==context.studentId)throw Error('未找到此学生。');
      children.push(result.member);
    }
    return context.studentId;
  }
  window.GrowingLegacy={parse,destination,link,target};
})();
