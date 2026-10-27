/* Reproduce the offline KaTeX assets from the pinned npm dependency. */
const fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..'),source=path.join(repo,'cloudflare/node_modules/katex'),target=path.join(repo,'platform-web/vendor/katex');
fs.mkdirSync(path.join(target,'fonts'),{recursive:true});
for(const name of ['katex.min.js','katex.min.css'])fs.copyFileSync(path.join(source,'dist',name),path.join(target,name));
fs.copyFileSync(path.join(source,'LICENSE'),path.join(target,'LICENSE.txt'));
for(const name of fs.readdirSync(path.join(source,'dist/fonts')))if(name.endsWith('.woff2'))fs.copyFileSync(path.join(source,'dist/fonts',name),path.join(target,'fonts',name));
const css=path.join(target,'katex.min.css');
fs.writeFileSync(css,fs.readFileSync(css,'utf8').replace(/,url\(fonts\/[^)]+\.(?:woff|ttf)\) format\("(?:woff|truetype)"\)/g,''));
console.log('Offline KaTeX '+require(path.join(source,'package.json')).version+' assets ready (WOFF2 fonts).');
