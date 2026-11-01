/* Reproduce the offline KaTeX assets from the pinned npm dependency. */
const fs=require('node:fs'),path=require('node:path');
const repo=path.resolve(__dirname,'..'),source=path.join(repo,'cloudflare/node_modules/katex'),target=path.join(repo,'platform-web/vendor/katex');
fs.mkdirSync(path.join(target,'fonts'),{recursive:true});
// Skip identical content; copying unchanged files can fail while Windows serves them.
function write(file,data){
  if(!Buffer.isBuffer(data))data=Buffer.from(data);
  if(!fs.existsSync(file)||!fs.readFileSync(file).equals(data))fs.writeFileSync(file,data);
}
write(path.join(target,'katex.min.js'),fs.readFileSync(path.join(source,'dist/katex.min.js')));
write(path.join(target,'katex.min.css'),fs.readFileSync(path.join(source,'dist/katex.min.css'),'utf8').replace(/,url\(fonts\/[^)]+\.(?:woff|ttf)\) format\("(?:woff|truetype)"\)/g,''));
write(path.join(target,'LICENSE.txt'),fs.readFileSync(path.join(source,'LICENSE')));
for(const name of fs.readdirSync(path.join(source,'dist/fonts')))if(name.endsWith('.woff2'))write(path.join(target,'fonts',name),fs.readFileSync(path.join(source,'dist/fonts',name)));
console.log('Offline KaTeX '+require(path.join(source,'package.json')).version+' assets ready (WOFF2 fonts).');
