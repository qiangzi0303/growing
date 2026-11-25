import {initWasm,Resvg,type InitInput} from '@resvg/resvg-wasm';
import {drawing} from './question-svg';
import {HttpError} from './database';
import coverage from './paper-render-assets/font-coverage.json';

const supported=new Set(coverage);
const MAX_IMAGE_CHARACTERS=180000;
let ready:Promise<void>|undefined;
let fonts:Uint8Array[]=[];

/** Worker entry imports the bundled WASM/TTF assets; tests inject the same bytes. */
export function configurePaperDrawingRenderer(wasm:WebAssembly.Module|Uint8Array,fontBuffers:Uint8Array[]):Promise<void>{
 if(ready)return ready;
 if(!fontBuffers.length||fontBuffers.some(f=>!(f instanceof Uint8Array)||!f.length))return Promise.reject(new HttpError(503,'题图渲染字体尚未配置。'));
 fonts=fontBuffers.map(f=>new Uint8Array(f));
 ready=initWasm(wasm as InitInput).catch(()=>{ready=undefined;fonts=[];throw new HttpError(503,'题图渲染器初始化失败。');});
 return ready;
}

function base64(bytes:Uint8Array):string{
 let binary='';
 for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(binary);
}

/** Raster previews are only verification inputs; stored question figures remain vectors. */
export async function renderPaperDrawing(value:unknown):Promise<string[]>{
 const normalized=drawing.normalize(value);
 if(!normalized)throw new HttpError(400,'题图数据无效，不能生成核对预览。');
 for(const f of normalized.figures)for(const s of f.elements)if(s.tag==='text'){
  // Never let resvg silently omit a Chinese label or unsupported mathematical symbol.
  if([...String(s.text)].some(c=>!/[\s]/u.test(c)&&!supported.has(c.codePointAt(0)!)))throw new HttpError(422,'题图包含当前字体未覆盖的字形，请补充字体后重试；题图尚未通过核对。');
 }
 if(!ready)throw new HttpError(503,'后台题图渲染器尚未配置。');
 await ready;
 const results:string[]=[];
 for(const svg of drawing.render(normalized)){
  const box=/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg);
  const width=Number(box?.[3]),height=Number(box?.[4]);
  if(!width||!height||width>4000||height>4000||Math.max(width/height,height/width)>30)throw new HttpError(422,'题图范围过大，请调整题图后重试。');
  let resvg:InstanceType<typeof Resvg>|undefined;
  let raster:ReturnType<InstanceType<typeof Resvg>['render']>|undefined;
  try{
   resvg=new Resvg(svg,{background:'#ffffff',font:{fontBuffers:fonts,defaultFontFamily:'Paper Diagram Sans',sansSerifFamily:'Paper Diagram Sans',serifFamily:'Paper Diagram Sans'},fitTo:{mode:'zoom',value:Math.min(2,1200/Math.max(width,height))}});
   raster=resvg.render();
   const png=raster.asPng();
   if(png.length>Math.floor((MAX_IMAGE_CHARACTERS-22)*3/4))throw new HttpError(422,'题图核对预览过大，请简化绘图后重试。');
   const image='data:image/png;base64,'+base64(png);
   if(image.length>MAX_IMAGE_CHARACTERS)throw new HttpError(422,'题图核对预览过大，请简化绘图后重试。');
   results.push(image);
  }catch(error){
   if(error instanceof HttpError)throw error;
   throw new HttpError(502,'后台题图渲染失败，原稿与进度已保留。');
  }finally{raster?.free();resvg?.free();}
 }
 return results;
}
