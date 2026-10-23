/* Revision-based sync. A conflict always requires an explicit choice; no silent last-write-wins. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GrowingSync=factory();})(globalThis,()=>{
  const allowed=key=>['growing-math-lessons-v1','growing-physics-lessons-v1','fraction-minute-v1','wordops_8A_unit3'].includes(key)||/^growing-(english-course|unit-rewards)-v1:(english-8a-0[1-8]|math-8[ab]-\d{2}|physics-8a-0[1-5])$/.test(key)||/^growing-activity-v1:[a-f0-9-]{36}$/.test(key);
  const courseAllowed=allowed;
  function syncAllowed(key){return courseAllowed(key)||/^growing-handwriting-v1:[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(key);}
  function clean(key,value){if(value===null)return null;const data=JSON.parse(value);if(key==='fraction-minute-v1')delete data.connection;return JSON.stringify(data);}
  function restore(key,value,previous){if(key!=='fraction-minute-v1'||value===null)return value;const next=JSON.parse(value),old=JSON.parse(previous||'{}');if(old.connection)next.connection=old.connection;return JSON.stringify(next);}
  function plan(local,remote,base){
    const actions=[];
    for(const key of new Set([...Object.keys(local),...Object.keys(remote),...Object.keys(base)])){
      if(!syncAllowed(key))continue;
      const value=local[key]??null,server=remote[key]||{value:null,revision:0},before=base[key];
      if(value===server.value){actions.push({key,type:'same',server});continue;}
      if(!before){actions.push({key,type:value===null?'pull':server.value===null&&server.revision===0?'push':'conflict',server,value});continue;}
      if(value===before.value)actions.push({key,type:'pull',server});
      else if(server.revision===before.revision)actions.push({key,type:'push',server,value});
      else actions.push({key,type:'conflict',server,value});
    }
    return actions;
  }
  return {allowed:syncAllowed,plan,clean,restore};
});
