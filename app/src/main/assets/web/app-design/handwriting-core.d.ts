declare const core: { validate(value: unknown): boolean; grade(value: unknown): boolean; KEY: RegExp; PREFIX: string; units(subject: string): string[]; knowledgeNodes: Record<string, string>; knowledgeUnits: Record<string,Record<string,string>>; nodeUnit(id:string): string | undefined };
export default core;
