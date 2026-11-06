declare module '*english-sentence-progress.js' {
  const progress: {
    key(unit: string): string;
    valid(sentence: { id: string; en: string }, record: any): boolean;
    summary(sentences: { id: string; en: string }[], state: any): { completed: number; total: number };
  };
  export default progress;
}
