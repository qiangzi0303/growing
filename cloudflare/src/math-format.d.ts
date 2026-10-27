declare module '*math-format.js' {
  const format: {version:string;normalize(source:string):string;validate(source:string):unknown[];html(source:string):string};
  export default format;
}
