import {before,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {configurePaperDrawingRenderer,renderPaperDrawing} from '../src/paper-drawing-renderer';

const figure=(elements:any[],width=240,height=160)=>({width,height,title:'题设图',elements});
const drawing=(figures:any[])=>({version:'question-svg-v1',figures,warnings:[]});
const label=(text:string,x=120,y=90)=>({tag:'text',text,x,y,fontSize:24});
before(async()=>{
 const wasm=await readFile(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm',import.meta.url));
 const font=await readFile(new URL('../src/paper-render-assets/NotoSansSC-Paper.ttf',import.meta.url));
 await configurePaperDrawingRenderer(wasm,[font]);
});

// Decode the actual PNG pixels rather than treating a data-URI prefix as proof of rendering.
function pixels(uri:string){
 const png=Buffer.from(uri.split(',')[1],'base64');
 assert.deepEqual(png.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 assert.equal(png[24],8);assert.equal(png[25],6);
 let offset=8;const parts:Buffer[]=[];
 while(offset<png.length){const n=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8);if(type==='IDAT')parts.push(png.subarray(offset+8,offset+8+n));offset+=n+12;}
 const raw=inflateSync(Buffer.concat(parts)),stride=width*4,result=Buffer.alloc(stride*height);
 const paeth=(a:number,b:number,c:number)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){
  const filter=raw[y*(stride+1)];
  for(let x=0;x<stride;x++){
   const pos=y*stride+x,a=x>=4?result[pos-4]:0,b=y?result[pos-stride]:0,c=x>=4&&y?result[pos-stride-4]:0;
   const predictor=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];assert.notEqual(predictor,undefined);
   result[pos]=(raw[y*(stride+1)+1+x]+predictor)&255;
  }
 }
 return {width,height,data:result,ink:Array.from({length:width*height},(_,i)=>result[i*4]<200&&result[i*4+1]<200&&result[i*4+2]<200).filter(Boolean).length};
}

test('renders real PNGs with visible Latin and Chinese text and no system fonts',async()=>{
 const images=await renderPaperDrawing(drawing([figure([label('A 52°')]),figure([label('时间')])]));
 assert.equal(images.length,2);
 for(const image of images){assert.ok(image.length<=180000);const p=pixels(image);assert.equal(p.width,480);assert.equal(p.height,320);assert.ok(p.ink>100,'font must produce visible glyphs');}
 assert.notEqual(images[0],images[1]);
});

test('retains edge labels by using the shared expanded SVG viewport',async()=>{
 const [image]=await renderPaperDrawing(drawing([figure([label('AB',0,0),{tag:'line',x1:5,y1:5,x2:230,y2:140}])]));
 const p=pixels(image);assert.ok(p.width>480&&p.height>320);assert.ok(p.ink>100);
});

test('rejects executable/embedded images, invalid drawings and excessive figure counts',async()=>{
 await assert.rejects(renderPaperDrawing({version:'question-svg-v1',figures:[],warnings:[]}));
 await assert.rejects(renderPaperDrawing(drawing([figure([{tag:'image',href:'https://example.invalid/image.png'}])])));
 await assert.rejects(renderPaperDrawing(drawing(Array.from({length:9},()=>figure([label('A')])))));
 await assert.rejects(renderPaperDrawing(drawing([figure([{...label('A'),onclick:'alert(1)'}])])));
});

test('refuses missing glyphs instead of silently dropping labels',async()=>{
 await assert.rejects(renderPaperDrawing(drawing([figure([label('🦆')])])),/字形/);
});

test('bounds raster dimensions and rejects unreasonable expanded canvases',async()=>{
 const [image]=await renderPaperDrawing(drawing([figure([{tag:'line',x1:10,y1:10,x2:2300,y2:2300}],2400,2400)]));
 const p=pixels(image);assert.equal(p.width,1200);assert.equal(p.height,1200);
 await assert.rejects(renderPaperDrawing(drawing([figure([label('A',9999,9999)])])),/范围/);
});

test('renders inside workerd with bundled WASM and font modules',async()=>{
 const directory=fileURLToPath(new URL('../src/',import.meta.url));
 const bundle=await build({stdin:{contents:`
 import wasm from './engine.wasm';
 import font from './font.ttf';
 import {configurePaperDrawingRenderer,renderPaperDrawing} from './paper-drawing-renderer';
 export default {async fetch(){
  await configurePaperDrawingRenderer(wasm,[new Uint8Array(font)]);
  const images=await renderPaperDrawing(${JSON.stringify(drawing([figure([label('时间 A')])]))});
  return Response.json({count:images.length,bytes:images[0].length,signature:images[0].startsWith('data:image/png;base64,iVBORw0KGgo')});
 }};
 `,resolveDir:directory,sourcefile:'worker-render-test.ts'},bundle:true,write:false,format:'esm',platform:'browser',external:['./engine.wasm','./font.ttf']});
 const wasm=await readFile(new URL('../node_modules/@resvg/resvg-wasm/index_bg.wasm',import.meta.url));
 const font=await readFile(new URL('../src/paper-render-assets/NotoSansSC-Paper.ttf',import.meta.url));
 const mf=new Miniflare(convertV4MiniflareOptions({compatibilityDate:'2026-10-22',modules:[
  {type:'ESModule',path:'worker.mjs',contents:bundle.outputFiles[0].text},
  {type:'CompiledWasm',path:'engine.wasm',contents:wasm},
  {type:'Data',path:'font.ttf',contents:font},
 ]}));
 try{
  const response=await mf.dispatchFetch('https://renderer.test');assert.equal(response.status,200);
  const result=await response.json() as any;assert.equal(result.count,1);assert.equal(result.signature,true);assert.ok(result.bytes>1000&&result.bytes<=180000);
 }finally{await mf.dispose();}
});
