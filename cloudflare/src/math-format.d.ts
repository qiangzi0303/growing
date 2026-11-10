declare module '*math-format.js' {
  const format: {version:string;parts(source:string):{text?:string;math?:string;display?:boolean}[];normalize(source:string):string;validate(source:string):unknown[];html(source:string):string};
  export default format;
}
