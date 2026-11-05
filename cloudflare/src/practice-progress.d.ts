declare module '*practice-progress.js' {
  const progress: {
    valid(value: unknown): boolean;
    result(record: unknown): { score: number; total: number; passed: boolean; legacy: boolean };
  };
  export default progress;
}
