declare module '*english-score.js' {
  const scoring: {
    formula: string;
    wordPassed(word: any, record: any, legacy?: boolean): boolean;
    summary(words: any[], records: any, sentences: {id: string; en: string}[], saved: any, legacy?: boolean, context?: {state?: any; lessons?: any[]}): {
      words: {completed: number; total: number}; sentences: {completed: number; total: number}; points: number; score: number; lessons: {total:number; mastered:number; items:any[]; timeRatio:number}; wrong:{total:number; conquered:number}; parts:Record<string,number>; cleared:boolean; progress:{done:number; total:number};
    };
  };
  export default scoring;
}
