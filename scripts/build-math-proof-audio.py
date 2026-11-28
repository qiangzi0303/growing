"""Generate packaged Mandarin MP3 and timed captions; requires edge-tts and mutagen."""
from pathlib import Path
import asyncio, hashlib, json, re, sys
# Load the host's complete CA bundle before optional, project-local TTS dependencies.
import certifi
repo=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(repo.parent/'.nmai/tmp/voice_deps'))
import edge_tts
from mutagen.mp3 import MP3
source=repo/'learning-ui/src/math-proof-narration.json'
out=repo/'app/src/main/assets/web/app-design/math-proof-audio'
out.mkdir(exist_ok=True)
manifest=repo/'learning-ui/src/math-proof-audio.json'
voice='zh-CN-YunxiNeural';rate='-5%'
plain=lambda s:re.sub(r'[^\w\u4e00-\u9fff]','',s).lower()
async def main():
 entries={}
 for key,cues in json.loads(source.read_text(encoding='utf-8')).items():
  text=''.join(c['speech'] for c in cues)
  digest=hashlib.sha256((voice+rate+text).encode()).hexdigest()[:12]
  file=out/f'{key}-{digest}.mp3';metadata=out/f'{key}-{digest}.json'
  if file.exists() and metadata.exists():
   entries[key]=json.loads(metadata.read_text(encoding='utf-8'));print('CACHED '+key,flush=True);continue
  marks=[];temporary=file.with_suffix('.part')
  async def generate():
   with temporary.open('wb') as f:
    async for chunk in edge_tts.Communicate(text,voice,rate=rate,boundary='WordBoundary').stream():
     if chunk['type']=='audio':f.write(chunk['data'])
     elif chunk['type']=='WordBoundary':marks.append(chunk)
  await asyncio.wait_for(generate(),90)
  duration=MP3(temporary).info.length
  if plain(''.join(m['text'] for m in marks))!=plain(text):raise ValueError('Spoken boundary text differs from script: '+key)
  starts=[0.0];count=0;targets=[];total=0
  for cue in cues[:-1]:total+=len(plain(cue['speech']));targets.append(total)
  for mark in marks:
   if len(starts)<=len(targets) and count>=targets[len(starts)-1]:starts.append(round(mark['offset']/1e7,4))
   count+=len(plain(mark['text']))
  if len(starts)!=len(cues) or not all(a<b for a,b in zip(starts,starts[1:])):raise ValueError('Caption alignment failed: '+key)
  entry={'file':'math-proof-audio/'+file.name,'duration':duration,'voice':voice,'rate':rate,'sha256':hashlib.sha256(temporary.read_bytes()).hexdigest(),
   'cues':[{'stage':c['stage'],'text':c['text'],'start':starts[i],'end':starts[i+1] if i+1<len(starts) else duration} for i,c in enumerate(cues)]}
  temporary.replace(file)
  metadata.write_text(json.dumps(entry,ensure_ascii=False,indent=2),encoding='utf-8')
  entries[key]=entry;print(f'OK {key}: {duration:.1f}s, {file.stat().st_size} bytes, {len(cues)} captions',flush=True)
 manifest.write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
asyncio.run(main())
