/* Rebuild the reviewable topic-to-question inventory from the actual course. */
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
import {mathStudyGuides} from '../learning-ui/src/math-study-guides.js';
import {proofNodeIds} from '../learning-ui/src/math-proof-model.js';
const require=createRequire(import.meta.url),repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),folder=repo+'/app/src/main/assets/web/app-design/';
const D=require(folder+'math-data.js'),A=require(folder+'application-practice.js'),F=require(folder+'math-study-focus.js');
const inventory=D.chapters.map(c=>({id:c.id,title:c.title,nodes:c.nodes.map(n=>({id:n.id,title:n.title,review:n.review,guide:mathStudyGuides[n.id],required:F[n.id].required,proof:proofNodeIds.includes(n.id),questions:A.questions(n,'math').map(q=>({id:q.id,prompt:q.prompt,answer:q.answer,explanation:q.explanation,level:q.level,type:q.type}))}))}));
const nodes=inventory.flatMap(c=>c.nodes),inline=nodes.filter(n=>n.guide.lab).length;
const lines=['# 数学课堂要点与应用练习覆盖','',`覆盖 ${inventory.length} 单元、${nodes.length} 知识点、${nodes.length*10} 道既有练习；其中 ${inline} 点使用参数探索，${proofNodeIds.length} 点保留分幕语音推导，其余使用概念、步骤与例题。`,'','保留题干、答案、题目 ID、每点 6 基础＋2 提高＋1 难题＋1 综合应用结构。每点保留两道要点课程题，其余位置允许使用审核后的拍照题；拍照题不继承被替换题的要点标记。','', '概念来自项目现有课程及本次补充定义，未声称逐字引用教材。参数探索用于观察，不替代一般性证明。新增探索显示实时文字结论；原有两个样板保留同步语音和字幕。',''];
for(const c of inventory){lines.push(`## ${c.title}`,'');for(const n of c.nodes){lines.push(`### ${n.title}（${n.id}）`,'',`概念：${n.review}`,'',`呈现：${n.proof?'四幕推导、语音与同步字幕':n.guide.lab?'参数探索 '+n.guide.lab:'概念辨析、步骤与例题；不强加动画'}`,'');for(const kind of ['exam','mistake']){lines.push(`**${kind==='exam'?'易考点':'易错点'}**：${n.guide[kind].text}`,'');for(const num of n.guide[kind].questions){const q=n.questions[num-1];lines.push(`- 第 ${num} 题${n.required.includes(q.id)?'（保留覆盖）':''}：${q.prompt}`);}lines.push('');}}}
const report=resolve(repo,'docs/plans/2026-11-28-math-study-coverage.md');writeFileSync(report,lines.join('\n'));
const tmp=resolve(repo,'../.nmai/tmp');mkdirSync(tmp,{recursive:true});writeFileSync(resolve(tmp,'math-study-coverage.json'),JSON.stringify(inventory,null,2));
console.log(JSON.stringify({units:inventory.length,topics:nodes.length,questions:nodes.length*10,inline,proof:proofNodeIds.length,text:nodes.length-inline-proofNodeIds.length,report}));
