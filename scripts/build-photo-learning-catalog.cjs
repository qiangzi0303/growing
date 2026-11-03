/* Derive photo-review links from the shipped lessons and geometry models. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const repo=path.resolve(__dirname,'..'),source=path.join(repo,'app/src/main/assets/web/app-design');
const handwriting=require(path.join(source,'handwriting-core.js'));
const math=require(path.join(source,'math-data.js'));
const context=vm.createContext({window:{}});
for(const name of ['geometry-models-data.js','geometry-models-more.js','geometry-models-advanced.js'])vm.runInContext(fs.readFileSync(path.join(source,name),'utf8'),context,{filename:name});
const knowledge=Object.entries(handwriting.knowledgeNodes).map(([id,title])=>{
  const unitId=handwriting.nodeUnit(id),href=path.posix.normalize('app-design/'+handwriting.knowledgeLink(id));
  if(!fs.existsSync(path.join(repo,'app/src/main/assets/web',href.split('?')[0])))throw Error('Missing lesson '+id);
  const lesson=math.nodes.find(n=>n.id===id);
  return {id,title,unitId,subject:unitId.split('-')[0],href,...(lesson?{criterion:lesson.criterion||'',review:lesson.review||''}:{})};
});
const models=context.window.GrowingGeometryModels.models.map(m=>({id:m.id,title:m.title,nodes:m.nodes,given:m.given,result:m.result,method:m.steps.slice(0,3),href:'app-design/geometry-models.html#model-'+m.id}));
if(models.length!==41||new Set(models.map(m=>m.id)).size!==models.length)throw Error('Unexpected geometry catalog');
const data={version:1,knowledge,models};
const target=path.join(repo,'cloudflare/src/photo-learning-catalog.json'),output=JSON.stringify(data,null,2)+'\n';
if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==output)fs.writeFileSync(target,output);
console.log('Photo review catalog: '+knowledge.length+' knowledge points, '+models.length+' geometry models.');
