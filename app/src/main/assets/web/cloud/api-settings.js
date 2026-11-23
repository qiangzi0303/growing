/* Compatibility entry for old deep links; credentials are managed by administrators. */
(()=>{
 'use strict';
 const menu=document.getElementById('account-menu'),identity=document.getElementById('account-identity');
 for(const id of ['open-api-settings','open-voice-settings'])document.getElementById(id)?.remove();
 if(window.GrowingNative?.configureDevice&&menu&&identity){
  const button=document.getElementById('open-device-settings')||document.createElement('button');
  button.id='open-device-settings';button.type='button';button.textContent='设备设置';
  if(!button.isConnected)identity.after(button);
  button.onclick=()=>{menu.open=false;window.GrowingNative.configureDevice();};
 }
 window.GrowingApiSettings={open(){
  if(!menu||menu.hidden)return;
  const message=document.getElementById('message');
  if(message)message.textContent='AI 模型由管理后台统一配置，登录后自动获取，无需填写个人密钥。';
  menu.open=false;
 }};
})();
