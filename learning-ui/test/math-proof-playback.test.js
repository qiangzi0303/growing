import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {proofTimeline,createProofPlayback,createProofAudioSource} from '../src/math-proof-playback.js';
const entries=JSON.parse(readFileSync(new URL('../src/math-proof-audio.json',import.meta.url)));

test('packaged narration covers every scene with continuous captions and intact audio',()=>{
 for(const entry of Object.values(entries)){
  assert.deepEqual([...new Set(entry.cues.map(c=>c.stage))],[0,1,2,3]);
  assert.equal(entry.cues[0].start,0);
  entry.cues.forEach((cue,i)=>{assert.ok(cue.end>cue.start);assert.equal(cue.end,entry.cues[i+1]?.start??entry.duration);});
  const audio=readFileSync(new URL('../../app/src/main/assets/web/app-design/'+entry.file,import.meta.url));
  assert.equal(createHash('sha256').update(audio).digest('hex'),entry.sha256);
  const timeline=proofTimeline(entry);
  for(let i=0;i<=100;i++){const p=i/100;assert.ok(Math.abs(timeline.progressAt(timeline.timeAt(p))-p)<1e-10);}
  for(const cue of entry.cues){assert.equal(timeline.captionAt(cue.start),cue.text);assert.equal(Math.min(3,Math.floor(timeline.progressAt(cue.start+.001)*4)),cue.stage);}
  assert.equal(timeline.timeAt(1),entry.duration);
 }
});

class Media extends EventTarget{
 currentTime=0;readyState=1;paused=true;error=null;loads=0;
 play(){this.paused=false;return this.pending??Promise.resolve();}
 pause(){this.paused=true;}
 load(){this.loads++;this.error=null;}
 removeAttribute(){}
 fire(name){this.dispatchEvent(new Event(name));}
}
function setup(options={}){
 const audio=new Media(),events=new EventTarget(),frames=new Map(),states=[];let id=0;
 const entry=entries['factor-difference'];
 const player=createProofPlayback({audio,entry,events,onChange:s=>states.push(s),raf:f=>{frames.set(++id,f);return id;},caf:i=>frames.delete(i),...options});
 return {audio,events,entry,player,frames,state:()=>states.at(-1),step(now){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(f=>f(now));}};
}
test('audio owns progression, buffering freezes it, seek and resume share a clock',async()=>{
 const h=setup();await h.player.play();
 h.audio.currentTime=h.entry.cues[3].start+.1;h.step(100);assert.equal(h.state().caption,h.entry.cues[3].text);
 const p=h.state().progress;h.audio.fire('waiting');h.step(1100);assert.equal(h.state().progress,p);assert.ok(h.state().loading);
 h.player.pause();assert.ok(h.audio.paused);assert.equal(h.frames.size,0);
 h.player.seek(.5);assert.equal(h.audio.currentTime,h.entry.cues[4].start);assert.equal(h.state().caption,h.entry.cues[4].text);
 await h.player.play();h.audio.currentTime+=1;h.step(1200);assert.ok(h.state().progress>.5);
 h.audio.fire('ended');assert.equal(h.state().progress,1);assert.equal(h.state().playing,false);
 await h.player.play();assert.equal(h.audio.currentTime,0);h.player.dispose();
});
test('silent playback, toggling, external audio and disposal stop sound and frames',async()=>{
 const h=setup();await h.player.play();h.player.setVoice(false);assert.ok(h.audio.paused);
 await h.player.play();h.step(0);h.step(100);assert.ok(h.state().progress>0);assert.ok(h.audio.paused);
 h.events.dispatchEvent(new Event('duck:course-audio-start'));assert.equal(h.state().playing,false);
 h.player.setVoice(true);await h.player.play();h.events.dispatchEvent(new Event('duck:stop-course-audio'));assert.ok(h.audio.paused);
 await h.player.play();h.player.dispose();assert.ok(h.audio.paused);assert.equal(h.frames.size,0);
 h.audio.fire('playing');assert.equal(h.frames.size,0);
});
test('late play fulfillment/rejection cannot restart a paused or replaced request',async()=>{
 for(const action of ['pause','seek','setVoice','dispose']){
  const h=setup();let resolve;h.audio.pending=new Promise(r=>{resolve=r;});
  const pending=h.player.play();await Promise.resolve();h.player[action](action==='seek'?.5:false);resolve();await pending;
  h.audio.fire('playing');assert.equal(h.state().playing,false);assert.equal(h.frames.size,0);assert.ok(h.audio.paused);
 }
 const h=setup();let reject;h.audio.pending=new Promise((_,r)=>{reject=r;});const old=h.player.play();await Promise.resolve();
 h.player.seek(.75);h.audio.pending=null;await h.player.play();reject(new Error('old request'));await old;
 assert.ok(h.state().playing);assert.equal(h.state().error,'');h.player.dispose();
});
test('pending downloads cannot play after a seek, mute or unmount',async()=>{
 for(const action of ['seek','setVoice','dispose']){
  let resolve;const ready=new Promise(r=>{resolve=r;});const h=setup({prepareAudio:()=>ready});
  const pending=h.player.play();h.player[action](action==='seek'?.5:false);resolve();await pending;
  assert.ok(h.audio.paused);assert.equal(h.state().playing,false);assert.equal(h.frames.size,0);
 }
});
test('seekable source deduplicates download, retries failures and revokes its Blob',async()=>{
 const audio=new Media();audio.src='test.mp3';let requests=0,revoked='',fail=true,signal;
 const source=createProofAudioSource(audio,{fetchFile:async(_,{signal:s})=>{requests++;signal=s;if(fail)throw Error('offline');return {ok:true,blob:async()=>new Blob(['audio'])};},createURL:()=> 'blob:proof',revokeURL:url=>{revoked=url;}});
 await assert.rejects(source.prepare());fail=false;
 await Promise.all([source.prepare(),source.prepare()]);await source.prepare();
 assert.equal(requests,2);assert.equal(audio.src,'blob:proof');assert.equal(audio.loads,1);
 source.dispose();assert.equal(revoked,'blob:proof');assert.ok(signal.aborted);
 await assert.rejects(source.prepare());
});
test('load and play errors offer retry, with pending metadata honoring the chosen scene',async()=>{
 const h=setup();h.audio.readyState=0;h.player.seek(.75);assert.equal(h.audio.currentTime,0);
 h.audio.readyState=1;h.audio.fire('loadedmetadata');assert.equal(h.audio.currentTime,h.entry.cues[6].start);
 h.audio.pending=Promise.reject(new Error('network'));await h.player.play();assert.match(h.state().error,/重试/);assert.ok(h.audio.paused);
 h.audio.error={code:2};h.audio.pending=null;await h.player.play();assert.equal(h.audio.loads,1);assert.equal(h.state().error,'');
 h.audio.fire('error');assert.equal(h.state().playing,false);assert.match(h.state().error,/关闭语音/);h.player.dispose();
});
