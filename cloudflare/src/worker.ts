import api, {type Env} from './index';
import wasm from '@resvg/resvg-wasm/index_bg.wasm';
import font from './paper-render-assets/NotoSansSC-Paper.ttf';
import {configurePaperDrawingRenderer,renderPaperDrawing} from './paper-drawing-renderer';
import {recognizeGlmPage} from './glm-ocr';
import {consumePhotoJobs,recoverPhotoJobs} from './photo-processing-agent';

export default {
 fetch:api.fetch,
 async queue(batch:MessageBatch<{id:string;revision:number}>,env:Env){
  await configurePaperDrawingRenderer(wasm,[new Uint8Array(font)]);
  await consumePhotoJobs(batch,env,{ocr:recognizeGlmPage,render:renderPaperDrawing});
 },
 async scheduled(_event:ScheduledController,env:Env){
  await recoverPhotoJobs(env);
 }
};
