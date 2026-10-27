"""Import reviewed mathematical text, never cropped question photographs."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

repo = Path(__file__).resolve().parents[1]
project = repo.parent
source = project / 'math/1025141010.pdf'
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
if source_hash != 'b2427c42c4c0ce6aae3e5d32e3558d0dcdaddd306f5c90d11d1de5d8245d92f2':
    raise ValueError('The source PDF changed; review every transcription before importing.')
packaged = repo / 'app/src/main/assets/web/app-design'
design = project / 'app-design'
script = r'''
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const math=require('./platform-web/math-format.js'),context={window:{}};
const dir='app/src/main/assets/web/app-design';
for(const name of ['math-wrong-questions-transcribed.js','math-wrong-questions-data.js'])vm.runInNewContext(fs.readFileSync(path.join(dir,name),'utf8'),context);
const data=context.window.GrowingMathWrongQuestions;
if(data.questions.length!==53)throw Error('Expected all 53 source blocks');
for(const [i,q] of data.questions.entries()){
  if(q.id!=='1025141010-'+String(i+1).padStart(2,'0')||q.image||q.format!==math.version)throw Error('Invalid question identity or format');
  q.text=math.normalize(q.text);
}
console.log(JSON.stringify(data));
'''
data = json.loads(subprocess.check_output(['node','-e',script],cwd=repo,text=True,encoding='utf-8'))
manifest = {'source':source.name,'sha256':source_hash,'pages':16,'format':'math-text-v1','questions':data['questions']}
for directory in [packaged,design]:
    target=directory/'math-wrong-questions/1025141010/manifest.json'
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for name in ['math-wrong-questions.html','math-wrong-questions.js','math-wrong-questions.css','math-wrong-questions-data.js','math-wrong-questions-transcribed.js']:
    shutil.copyfile(packaged/name,design/name)
print(json.dumps({'pages':16,'questions':len(data['questions']),'format':'math-text-v1','imagesUsedAsQuestions':0},ensure_ascii=False))
