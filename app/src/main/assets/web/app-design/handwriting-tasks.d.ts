declare const tasks: {
  forUnit(subject: string, unitId: string): { id: string; prompt: string; nodes?: string[] }[];
};
export default tasks;
