declare module '*question-drawing.js' {
  export type QuestionDrawing={version:string;figures:{width:number;height:number;title:string;elements:Record<string,any>[]}[];warnings:string[]};
  const api:{version:string;normalize(value:unknown):QuestionDrawing|null;render(value:unknown):string[]};
  export default api;
}
