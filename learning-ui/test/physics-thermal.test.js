import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function setup(node='temperature'){
 let frame;const window={addEventListener(){},removeEventListener(){}};
 const scope={window,URLSearchParams,Math,performance:{now:()=>0},document:{hidden:false,addEventListener(){},removeEventListener(){}},requestAnimationFrame:fn=>(frame=fn,1),cancelAnimationFrame(){frame=null;},setTimeout,clearTimeout};
 vm.runInNewContext(await readFile(new URL('../../app/src/main/assets/web/app-design/student-physics-labs.js',import.meta.url),'utf8'),scope);
 const c=window.GrowingStudentPhysicsLabs.create({params:new URLSearchParams({node:'phy-'+node})});
 return {c,tick:()=>frame?.(50)};
}
test('thermal models agree with independently calculated temperatures and phase boundaries',async()=>{
 const {c}=await setup();const select=n=>c.actions.select('phy-'+n),change=c.actions.change;
 change('temperature',-5);change('time',30);assert(Math.abs(c.inspect().reading+5)<.02);assert.equal(c.inspect().valid,true);
 change('placement','wall');assert.equal(c.inspect().valid,false);
 select('cooling');change('time',0);assert.equal(c.inspect().temperature,80);change('time',20);assert(c.inspect().temperature>20&&c.inspect().temperature<22);
 select('evaporation');const base=c.inspect();change('area',2);assert.equal(c.inspect().index,2*base.index);assert(c.inspect().remaining<base.remaining);
 select('boiling');change('energy',90);assert.equal(c.inspect().temperature,100);assert.equal(c.inspect().boiling,true);change('heater',false);assert.equal(c.inspect().boiling,false);change('pressure','low');assert.equal(c.inspect().temperature,90);
 select('liquid');change('humidity',100);change('air',25);assert(Math.abs(c.inspect().dewPoint-25)<1e-9);change('surface',30);assert.equal(c.inspect().dew,false);change('surface',10);assert.equal(c.inspect().dew,true);
 select('melting');change('progress',50);assert(Math.abs(c.inspect().temperature)<1e-9);assert.equal(c.inspect().fraction,.5);change('direction','cool');assert.equal(c.inspect().fraction,.5);change('progress',80);assert.equal(c.inspect().fraction,0);change('material','rosin');assert.equal(c.model.state.direction,'heat');assert(!c.model.controls.some(v=>v.key==='direction'));
 select('sublimation');change('direction','deposit');assert.equal(c.inspect().absorbs,false);
 select('water-cycle');change('stage','deposit');change('cloud',5);assert.equal(c.inspect().allowed,false);change('cloud',-5);assert.equal(c.inspect().allowed,true);
 c.destroy();
});
test('all eight thermal scenes play; endpoint stops, replay restarts, edits pause and destroy cancels',async()=>{
 const {c,tick}=await setup();
 for(const id of ['temperature','cooling','evaporation','boiling','liquid','melting','sublimation','water-cycle']){c.actions.select('phy-'+id);assert.equal(c.model.canPlay,true,id);}
 c.actions.select('phy-temperature');c.actions.change('time',29.99);c.actions.play();tick();assert.equal(c.model.state.time,30);assert.equal(c.model.playing,false);
 c.actions.play();assert.equal(c.model.state.time,0);assert.equal(c.model.playing,true);c.actions.change('temperature',50);assert.equal(c.model.playing,false);
 c.actions.select('phy-liquid');const svg=c.model.svg;c.actions.play();for(let i=0;i<10;i++)c.actions.step();assert.notEqual(c.model.svg,svg);c.destroy();tick();assert.throws(()=>c.actions.play(),/销毁/);
});
