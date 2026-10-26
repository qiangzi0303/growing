const fs=require('node:fs');
const path=require('node:path');
const web=path.resolve(__dirname,'../app/src/main/assets/web/app-design');
const M=require(path.join(web,'english-visual-data.js'));
let sections='',y=118;
for(const [group,label] of [['space','01 / 空间关系 · 17 个表达'],['motion','02 / 行走与奔跑 · 16 个表达']]){
  sections+=`<text x="36" y="${y}" font-size="24" fill="#405f4b">${label}</text>`;y+=24;
  const entries=M.words.filter(w=>w.group===group);
  entries.forEach((w,i)=>{
    const x=30+(i%4)*320,top=y+Math.floor(i/4)*245;
    const scene=M.svg(w,.35,'atlas-'+w.id).replace('<svg ',`<svg x="${x}" y="${top+52}" width="310" height="170" `);
    sections+=`<rect x="${x}" y="${top}" width="310" height="234" rx="16" fill="#fffdf5" stroke="#dce3d5"/><text x="${x+18}" y="${top+29}" font-size="23" fill="#365346" font-family="Georgia,serif">${M.esc(w.word)}</text><text x="${x+18}" y="${top+49}" font-size="12" fill="#778571">${M.esc(w.zh)}</text>${scene}`;
  });
  y+=Math.ceil(entries.length/4)*245+48;
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1340" height="${y+30}" viewBox="0 0 1340 ${y+30}" role="img" aria-label="英语空间关系与行走表达 SVG 词汇图谱"><metadata>${M.esc(fs.readFileSync(path.join(web,'english-motion-NOTICE.txt'),'utf8'))}</metadata><rect width="1340" height="100%" fill="#f6f6ee"/><g font-family="system-ui,Microsoft YaHei,sans-serif"><text x="36" y="49" font-size="30" fill="#29463d">英语 · 看图记单词</text><text x="36" y="77" font-size="14" fill="#7a887b">33 个词与短语 / 在英语学科的「动画记单词」中播放动作、对照例句。</text>${sections}<text x="36" y="${y+5}" font-size="12" fill="#666">Character adapted from Ian Xiaohei Illustrations · Copyright (c) 2026 Ian · MIT</text></g></svg>\n`;
const target=path.join(web,'english-visual-atlas.svg');
if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==svg)fs.writeFileSync(target,svg,'utf8');
console.log('SVG vocabulary atlas generated: '+M.words.length+' entries.');
