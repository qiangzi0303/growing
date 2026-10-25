declare module '*word-mastery-rules.js' {
  const rules: { passed(word: any, record: any): boolean; historical(word: any, record: any): boolean };
  export default rules;
}
