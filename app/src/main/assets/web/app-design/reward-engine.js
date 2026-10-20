(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.GrowingRewards=factory();
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const finite=(n,max)=>Number.isFinite(n)&&n>=0&&n<=max;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const cents=n=>Math.round(n*100);
  function budget(gameMinutes,cashYuan,enabled=true){
    if(!Number.isInteger(gameMinutes)||!finite(gameMinutes,600000)||!finite(cashYuan,100000)||Math.abs(cashYuan*100-cents(cashYuan))>1e-6)throw Error('游戏时间须为0—600000的整数分钟，红包须为0—100000元且最多两位小数。');
    return {gameMinutes,cashYuan,enabled:enabled!==false};
  }
  function restore(raw,legacy){
    const d={version:1,defaultBudgetVersion:2,config:budget(120,200),peak:0,done:0,total:0,paidGame:0,paidCash:0,history:[]};
    if(raw?.version===1&&raw.config){
      d.config=budget(raw.config.gameMinutes,raw.config.cashYuan,raw.config.enabled);
      if(!finite(raw.peak,1)||!Number.isInteger(raw.paidGame)||!finite(raw.paidGame,d.config.gameMinutes)||!Number.isInteger(raw.paidCash)||!finite(raw.paidCash,cents(d.config.cashYuan)))throw Error('奖励存档格式不正确，原存档已保留。');
      Object.assign(d,{peak:raw.peak,done:raw.done||0,total:raw.total||0,paidGame:raw.paidGame,paidCash:raw.paidCash,legacyLocked:raw.legacyLocked===true,history:Array.isArray(raw.history)?raw.history:[]});
      if(raw.defaultBudgetVersion!==2&&d.config.cashYuan===100&&!locked(d))d.config.cashYuan=200;
      return d;
    }
    // Import an existing whole-unit promise once; paid legacy items remain paid.
    if(legacy){
      const c=legacy.config||{},a=legacy.award;
      const game=Number.isFinite(c.gameMinutes)?c.gameMinutes:Number.isFinite(c.hours)?Math.round(c.hours*60):120;
      const oldCash=Number.isFinite(c.cashYuan)?c.cashYuan:Number.isFinite(c.yuan)?c.yuan:200;
      const cash=oldCash===100&&!a?200:oldCash;
      d.config=budget(game,cash,c.enabled);
      if(a&&(Number.isFinite(a.unlockedAt)||Number.isFinite(a.earnedAt))){
        d.config=budget(Number.isFinite(a.gameMinutes)?a.gameMinutes:Math.round(a.hours*60),Number.isFinite(a.cashYuan)?a.cashYuan:a.yuan);
        d.peak=1;d.legacyLocked=true;
        if(a.game||a.gameAt)d.paidGame=d.config.gameMinutes;
        if(a.cash||a.moneyAt)d.paidCash=cents(d.config.cashYuan);
        d.history.push({legacy:true,at:a.unlockedAt||a.earnedAt,game:d.paidGame,cash:d.paidCash});
      }
    }
    return d;
  }
  function accrue(data,done,total){
    if(!Number.isInteger(done)||!Number.isInteger(total)||done<0||total<0||done>total)throw Error('掌握进度无效。');
    const d=clone(data);d.done=done;d.total=total;
    if(d.config.enabled&&total)d.peak=Math.max(d.peak,done/total);
    return d;
  }
  const locked=d=>!!d.legacyLocked||d.history.some(x=>!x.legacy)||d.paidGame>0||d.paidCash>0;
  function amounts(d){
    const game=Math.floor(d.config.gameMinutes*d.peak+1e-8),cash=Math.floor(cents(d.config.cashYuan)*d.peak+1e-8);
    return {game,cash,availableGame:Math.max(0,game-d.paidGame),availableCash:Math.max(0,cash-d.paidCash)};
  }
  function configure(data,game,cash,enabled=true){
    if(locked(data))throw Error('已有核销或旧版锁定奖励，不能修改本单元奖励总额。');
    return {...clone(data),config:budget(game,cash,enabled)};
  }
  function redeem(data,kind,parent,at=Date.now()){
    if(!['game','cash'].includes(kind))throw Error('奖励类型无效。');
    if(typeof parent!=='string'||!parent.trim()||parent.trim().length>30)throw Error('请填写家长称呼（1—30字）。');
    const a=amounts(data),value=kind==='game'?a.availableGame:a.availableCash;
    if(!value)throw Error('当前没有可核销额度。');
    const d=clone(data);d[kind==='game'?'paidGame':'paidCash']+=value;
    d.history.push({kind,amount:value,parent:parent.trim(),at});
    return d;
  }
  return {restore,accrue,configure,redeem,amounts,locked};
});
