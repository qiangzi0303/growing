(()=>{
  'use strict';
  const $=s=>document.querySelector(s),base=window.GrowingNative?String(GrowingNative.cloudApiUrl?.()||'').replace(/\/$/,''):'';
  async function load(){
    $('#release').hidden=true;$('#retry-download').hidden=true;$('#download-status').textContent='正在查询最新版本…';
    try{
      const response=await fetch(base+'/downloads/update.json',{cache:'no-store',credentials:'omit'});
      if(!response.ok)throw Error(response.status===404?'安装包尚未发布，请稍后再来。':response.status===503?'新版正在分发，请稍后重新查询。':'暂时无法查询版本，请稍后重试。');
      const release=await response.json(),filename='growing-'+release.versionName+'.apk';
      if(release.schemaVersion!==1||release.packageName!=='com.qiangzi0303.growing'||!Number.isSafeInteger(release.versionCode)||typeof release.versionName!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(release.versionName)||release.apkUrl!==filename||!Number.isSafeInteger(release.sizeBytes)||release.sizeBytes<=0)throw Error('安装包信息不完整，请稍后重试。');
      $('#download-apk').href=base+'/downloads/'+filename;$('#download-apk').download=filename;
      $('#release-version').textContent='版本 '+release.versionName+' · '+(release.sizeBytes/1024/1024).toFixed(1)+' MB';
      $('#release-notes').textContent=release.notes||'优化学习体验。';$('#download-status').textContent='最新正式版已就绪。';$('#release').hidden=false;
    }catch(error){$('#download-status').textContent=error.message;$('#retry-download').hidden=false;}
  }
  $('#retry-download').addEventListener('click',load);load();
})();
