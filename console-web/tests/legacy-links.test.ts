import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { legacy } from '@/features/legacy/links';
it('keeps website entries on the website and returns only explicit console registration', () => {
 for (const role of ['Admin','Parent']) {
  for (const hash of ['', '#register', '#learning-reports', '#question-bank']) expect(legacy.destination({role, roleSelectionRequired:false},false,legacy.parse('',hash))).toBeNull();
 }
 expect(legacy.destination({role:'Student',roleSelectionRequired:false},false,legacy.parse('',''))).toBeNull();
 expect(legacy.destination({role:'Parent'},false,legacy.parse('',''))).toBeNull();
 expect(legacy.destination({role:'Admin'},true,legacy.parse('',''))).toBeNull();
 expect(legacy.destination({role:'Parent',roleSelectionRequired:false},false,legacy.parse('?legacy=1&action=settings',''))).toBeNull();
 expect(legacy.destination({role:'Parent',roleSelectionRequired:false},false,legacy.parse('?legacy=1','#register'))).toBe('/console/home');
});
it('resolves exact bound children and protected Admin members without fallback', async () => {
 const api=vi.fn().mockResolvedValue({member:{id:'b',role:'Student',displayName:'小贝'}});
 await expect(legacy.target([{id:'a'}],{role:'Parent'},api,{studentId:'b'})).rejects.toThrow('关联');expect(api).not.toHaveBeenCalled();
 const children=[{id:'a'}];expect(await legacy.target(children,{role:'Admin'},api,{studentId:'b'})).toBe('b');expect(api).toHaveBeenCalledWith('/admin/members/b');expect(children).toHaveLength(2);
 api.mockRejectedValue(new Error('404'));await expect(legacy.target([{id:'a'}],{role:'Admin'},api,{studentId:'unknown'})).rejects.toThrow('404');
 for(const studentId of ['',null,[],undefined])await expect(legacy.target([{id:'a'}],{role:'Parent'},api,{studentId} as never)).rejects.toThrow();
});
it('old paper mount consumes student without paper and refuses unbound target', async () => {
 new Function(readFileSync('../platform-web/my-papers.js','utf8'))();
 const root=document.createElement('div');document.body.append(root);const api=vi.fn(async(path:string)=>path==='/parent/children'?[{id:'a',displayName:'小安'},{id:'b',displayName:'小贝'}]:[]);
 const papers=(window as any).GrowingPapers;await papers.mountLegacy(root,api,String,()=>true,{role:'Parent'},{studentId:'b'});
 expect((root.querySelector('[data-student]') as HTMLSelectElement).value).toBe('b');expect(api).toHaveBeenCalledWith('/question-bank/papers?studentId=b');expect(api).not.toHaveBeenCalledWith('/question-bank/papers?studentId=a');root.remove();
 const denied=document.createElement('div');document.body.append(denied);api.mockClear();await expect(papers.mountLegacy(denied,api,String,()=>true,{role:'Parent'},{studentId:'x'})).rejects.toThrow('关联');expect(api.mock.calls.filter(([url])=>url.startsWith('/question-bank/'))).toHaveLength(0);denied.remove();
});
it('shared sound control changes the existing engine, storage and iframe attach', async () => {
 const engine={play:vi.fn(),setEnabled:vi.fn(),setVolume:vi.fn(),unlock:vi.fn().mockResolvedValue(true)};
 const source=readFileSync('../platform-web/interaction-sounds.js','utf8').replace(/^import[^\n]+\n/,'');
 new Function('play','setEnabled','setVolume','unlock',source)(engine.play,engine.setEnabled,engine.setVolume,engine.unlock);
 const sound=window.GrowingInteractionSounds!;await sound.setEnabled(false);expect(sound.isEnabled()).toBe(false);expect(engine.setEnabled).toHaveBeenLastCalledWith(false);expect(localStorage.getItem('growing-interaction-sounds-v1')).toBe('off');
 await sound.setEnabled(true);expect(engine.unlock).toHaveBeenCalledOnce();expect(sound.isEnabled()).toBe(true);
 window.dispatchEvent(new StorageEvent('storage',{key:'growing-interaction-sounds-v1',newValue:'off'}));expect(sound.isEnabled()).toBe(false);
 const frame=document.implementation.createHTMLDocument('classroom');const button=frame.createElement('button');frame.body.append(button);sound.attach(frame);sound.attach(frame);engine.play.mockClear();button.click();expect(engine.play).toHaveBeenCalledOnce();
});
it('round trips exact student and paper and rejects untrusted targets', () => {
 const link = legacy.link('my-papers','/console/students/a','a','paper-1'); const url = new URL(link,'https://local');
 expect(legacy.parse(url.search,url.hash)).toMatchObject({legacy:true,action:'my-papers',studentId:'a',paperId:'paper-1',returnTo:'/console/students/a'});
 for (const value of ['https://evil/','//evil/','/api/auth/me','/console/login','/console/../api','/console/home?token=secret']) expect(()=>legacy.link('settings',value)).toThrow();
 for (const query of ['?legacy=1&action=evil','?legacy=1&action=settings&student=','?legacy=1&action=settings&student=a&student=b','?legacy=1&action=my-papers&paper=','?legacy=1&return=//evil']) expect(legacy.parse(query,'').error).toBeTruthy();
 expect(legacy.parse('?legacy=1&action=my-papers&student=a','').studentId).toBe('a');
});
