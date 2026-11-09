declare module '*english-score.js' {
  const scoring: {
    formula: string;
    wordPassed(word: any, record: any, legacy?: boolean): boolean;
    summary(words: any[], records: any, sentences: {id: string; en: string}[], saved: any, legacy?: boolean): {
      words: {completed: number; total: number}; sentences: {completed: number; total: number}; points: number; score: number;
    };
  };
  export default scoring;
}
