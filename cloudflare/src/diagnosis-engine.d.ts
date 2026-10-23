declare module '*diagnosis-engine.js' {
  interface Engine {
    graph(data: unknown): unknown;
    createAssessment(graph: unknown, targets: string[]): any;
    inspect(graph: unknown, session: any): any;
    answer(graph: unknown, session: any, qid: string, choice: number | null): any;
    assessmentCredit(graph: unknown, session: any): Record<string, number> | null;
  }
  const engine: Engine;
  export default engine;
}
