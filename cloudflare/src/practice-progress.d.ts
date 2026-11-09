declare module '*practice-progress.js' {
  const progress: {
    mastery(record: unknown): { feynman: number; application: number; score: number };
    fraction(record: unknown, historical?: boolean): { feynman: number; application: number; score: number };
    valid(value: unknown): boolean;
    result(record: unknown): { score: number; total: number; passed: boolean; legacy: boolean };
  };
  export default progress;
}
