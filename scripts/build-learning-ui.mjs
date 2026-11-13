/* Build and stage the student Vue/Vant pages for both offline APK and Worker assets. */
import { existsSync, mkdirSync, readFileSync, copyFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),project=dirname(repo),ui=join(repo,'learning-ui');
const vite=join(ui,'node_modules/vite/bin/vite.js');
if(!process.argv.includes('--stage-only')){
  if(!existsSync(vite)){
    const npmPaths=[resolve(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),resolve(dirname(process.execPath),'../lib/node_modules/npm/bin/npm-cli.js')];
    const npm=npmPaths.find(existsSync);
    if(npm)execFileSync(process.execPath,[npm,'ci','--no-audit','--no-fund'],{cwd:ui,stdio:'inherit'});
    else execFileSync('npm',['ci','--no-audit','--no-fund'],{cwd:ui,stdio:'inherit'});
  }
  execFileSync(process.execPath,[vite,'build'],{cwd:ui,stdio:'inherit'});
}
const course=join(repo,'app/src/main/assets/web/app-design');
const assetRevision='20261113-partial-practice-1';
function reviseHtml(path,names){
 if(!existsSync(path))return;
 const before=readFileSync(path,'utf8'),after=before.replace(/<(?:script|link)\b[^>]*>/gi,tag=>tag.replace(/\b(src|href)=(['"])([^'"<>]+)\2/g,(all,attr,quote,value)=>{
  const name=value.split(/[?#]/)[0].split('/').pop();if(!names.has(name))return all;
  const hash=value.indexOf('#'),fragment=hash<0?'':value.slice(hash),url=hash<0?value:value.slice(0,hash),query=url.indexOf('?'),base=query<0?url:url.slice(0,query),params=new URLSearchParams(query<0?'':url.slice(query+1));
  params.set('studentUi',assetRevision);return attr+'='+quote+base+'?'+params+fragment+quote;
 }));if(after!==before)writeFileSync(path,after);
}
const newModels=['student-pages.js','student-catalog-model.js','student-summary-model.js','student-resources-model.js','student-math-course.js','student-english-course.js','student-knowledge.js','student-handwriting.js','student-english-labs.js','student-math-resources.js','student-math-labs.js','student-physics-labs.js','student-triangle-centers.js','student-fraction-course.js','student-midterm.js','student-unit3-course.js','student-paper-ai.js','student-figure-editor.js'];
newModels.push('student-duck-controls.js');
newModels.push('practice-progress.js','math-figures.js','practice-figures.js');
const migratedAssets=['catalog.js','unit-summary.js','math-course.js','english-course.js','knowledge.js','handwriting.js','index.html','units.html','study.html','unit-summary.html','math-resources.html','english-resources.html','physics-resources.html','math-course.html','physics-course.html','english-course.html','knowledge.html','physics-knowledge.html','handwriting.html','english-visual-lab.html','english-visual-quiz.html','english-sentence-demo.html','english-visual-lab.js','english-visual-quiz.js','english-sentence-demo.js','math-exam-practice.html','math-wrong-questions.html','math-exam-practice.js','math-wrong-questions.js','math-explore-lab.html','geometry-models.html','math-lab.js','geometry-models.js'];
const targets=[course,join(project,'app-design'),join(repo,'cloudflare/public/learn/app-design')];
migratedAssets.push('physics-explore-lab.html','physics-sound-lab.html','triangle-centers.html','triangle-centers-legacy.js','math-exam-midterm.html','math-exam-midterm-graph.html','math-exam-midterm-answers.js','math-exam-midterm-graph.js','paper-knowledge-graph.js','math-geometry-links.js');
migratedAssets.push('course-duck.js','companion-duck/index.html','companion-duck/bootstrap.js','companion-duck/classroom.js','companion-duck/companion.js','companion-duck/duck.js');
const revisedNames=new Set([...newModels,...migratedAssets,'vant-home.js','course-duck.js','student-duck-controls.js'].map(name=>name.split('/').pop()));
for(const target of [course,join(project,'app-design')])for(const name of migratedAssets.filter(name=>name.endsWith('.html')))reviseHtml(join(target,name),revisedNames);
for(const target of [join(repo,'app/src/main/assets/web'),project])for(const name of ['fraction-ops/分式作战_一分钟学习版.html','word-ops-unit3/index.html'])reviseHtml(join(target,name),revisedNames);
reviseHtml(join(repo,'platform-web/index.html'),new Set(['student-platform.js','student-photo-review.js','vant-home.js','app.js','photo-review.js','my-papers.js','question-bank.js']));
for(const target of targets){
  const vendor=join(target,'vendor/learning-ui');mkdirSync(vendor,{recursive:true});
  for(const name of ['learning-ui.js','learning-ui.css'])copyFileSync(join(ui,'dist',name),join(vendor,name));
  const licenses=['vue','vant'].map(name=>name+'\n'+readFileSync(join(ui,'node_modules',name,'LICENSE'),'utf8')).join('\n\n');
  writeFileSync(join(vendor,'LICENSES.txt'),licenses);
  if(target!==course)copyFileSync(join(course,'vant-home.js'),join(target,'vant-home.js'));
  if(target!==course)for(const name of newModels)copyFileSync(join(course,name),join(target,name));
  if(target!==course)for(const name of migratedAssets){
   if(target===join(project,'app-design')&&name!=='course-duck.js'&&!name.startsWith('companion-duck/'))continue;
   mkdirSync(dirname(join(target,name)),{recursive:true});copyFileSync(join(course,name),join(target,name));
  }
}
for(const target of ['platform-web','app/src/main/assets/web/cloud','cloudflare/public']){
  mkdirSync(join(repo,target),{recursive:true});copyFileSync(join(course,'vant-home.js'),join(repo,target,'vant-home.js'));
}
for(const name of ['fraction-ops/分式作战_一分钟学习版.html','word-ops-unit3/index.html'])copyFileSync(join(repo,'app/src/main/assets/web',name),join(repo,'cloudflare/public/learn',name));
for(const target of ['app/src/main/assets/web/cloud','cloudflare/public']){
  for(const name of ['student-platform.js','student-photo-review.js','student-paper-pages.js','photo-review.js','my-papers.js','question-bank.js','app.js','index.html','cloud-storage.js'])copyFileSync(join(repo,'platform-web',name),join(repo,target,name));
}
for(const target of [course,join(project,'app-design'),join(repo,'cloudflare/public/learn/app-design')])copyFileSync(join(repo,'platform-web/student-photo-review.js'),join(target,'student-photo-review.js'));
for(const target of ['platform-web','app/src/main/assets/web/cloud','cloudflare/public']){
 for(const name of ['student-paper-ai.js','student-figure-editor.js'])copyFileSync(join(course,name),join(repo,target,name));
 const vendor=join(repo,target,'vendor/learning-ui');mkdirSync(vendor,{recursive:true});
 for(const name of ['learning-ui.js','learning-ui.css','LICENSES.txt'])copyFileSync(join(course,'vendor/learning-ui',name),join(vendor,name));
}
console.log('Student Vue/Vant pages staged for APK, source preview and Worker.');
