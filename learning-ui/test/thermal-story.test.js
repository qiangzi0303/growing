import test from 'node:test';
import assert from 'node:assert/strict';
import {thermalStories,thermalDefaults,thermalState,thermalCurve} from '../src/thermal-story-model.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('melting and freezing conserve energy across both phase boundaries',()=>{
 const id='phy-melting',v=thermalDefaults(id);
 const initial=thermalState(id,v,0),start=thermalState(id,v,.25),middle=thermalState(id,v,.5),end=thermalState(id,v,.75),final=thermalState(id,v,1);
 close(initial.temperature,-20);close(start.temperature,0);close(start.liquid,0);close(middle.temperature,0);close(middle.liquid,.5);close(end.liquid,1);close(final.temperature,20);
 close(end.heat-start.heat,.05*334000);close(middle.time,middle.heat/v.power);
 close(thermalState(id,{...v,power:v.power*2},.5).time,middle.time/2);
 close(thermalState(id,{...v,mass:v.mass*2},.5).heat,middle.heat*2);
 const frozen=thermalState(id,{...v,direction:'freeze'},1),half=thermalState(id,{...v,direction:'freeze'},.5);
 close(frozen.temperature,-20);close(frozen.liquid,0);close(half.liquid,.5);close(half.temperature,0);close(frozen.heat,final.heat);
});
test('boiling holds 100 C while latent heat accounts for vaporized mass; switching heat off stops boiling',()=>{
 const id='phy-boiling',v=thermalDefaults(id),start=thermalState(id,v,.5),end=thermalState(id,v,1);
 close(start.temperature,100);close(start.gas,0);close(end.temperature,100);close(end.gas,.1);
 close(end.heat-start.heat,(v.mass/1000)*end.gas*2260000);
 const off=thermalState(id,{...v,heater:'off'},.75),on=thermalState(id,v,.75);
 assert.equal(off.boiling,false);assert.equal(on.boiling,true);close(off.heat,on.heat);close(off.temperature,100);
});
test('cooling approaches ambient from above with decreasing equal-interval drops',()=>{
 const curve=thermalCurve('phy-cooling',thermalDefaults('phy-cooling'));
 assert.ok(curve.every((x,i)=>x.t>=20&&(!i||x.t<=curve[i-1].t)));
 assert.ok(curve[0].t-curve[10].t>curve[80].t-curve[90].t);
});
test('reading conditions, condensation threshold and controlled evaporation change the conclusions',()=>{
 assert.equal(thermalState('phy-temperature',{},1).valid,true);
 assert.equal(thermalState('phy-temperature',{eye:'above'},1).valid,false);
 assert.equal(thermalState('phy-temperature',{placement:'wall'},1).valid,false);
 close(thermalState('phy-temperature',{placement:'outside'},1).temperature,20);
 assert.equal(thermalState('phy-liquid',{wall:18,dew:18},1).drops,0);
 assert.ok(thermalState('phy-liquid',{wall:8,dew:18},1).drops>0);
 const same=thermalState('phy-evaporation',{strength:1},1),fast=thermalState('phy-evaporation',{strength:3},1);
 close(same.base,same.liquid);assert.ok(fast.liquid<fast.base);
 close(thermalState('phy-sublimation',{direction:'sublime'},1).gas,1);
 close(thermalState('phy-sublimation',{direction:'deposit'},1).gas,0);
 assert.match(thermalState('phy-water-cycle',{route:'rain'},1).status,/没有相变/);
 assert.match(thermalState('phy-water-cycle',{route:'snow'},1).status,/融雪吸热/);
});
test('all eight stories support every control boundary and deterministic seeking through four shots',()=>{
 assert.equal(Object.keys(thermalStories).length,8);
 for(const [id,story] of Object.entries(thermalStories)){
  assert.equal(story.shots.length,4);
  for(const control of story.controls){
   for(const value of control.options?control.options.map(o=>o[0]):[control.min,control.max]){
    for(const p of [0,.249,.25,.5,.75,1]){
     const state=thermalState(id,{[control.key]:value},p);
     for(const value of Object.values(state))if(typeof value==='number')assert.ok(Number.isFinite(value),id);
     assert.equal(state.stage,Math.min(3,Math.floor(p*4)));
     assert.deepEqual(state,thermalState(id,{[control.key]:value},p));
    }
   }
  }
 }
});
