import '../../../../platform-web/legacy-navigation.js';
export interface LegacyContext { action?: string; studentId?: string; paperId?: string; subject?: 'math'|'english'; returnTo?: string; legacy?: boolean; register?: boolean; error?: string }
declare global { interface Window { GrowingLegacy: { parse(search: string, hash: string): LegacyContext; destination(profile: {role: string; roleSelectionRequired?: boolean}, native: boolean, context: LegacyContext): string | null; link(action: string, returnTo?: string, studentId?: string, paperId?: string, subject?: 'math'|'english'): string; target(children: {id:string}[], user:{id?:string;role:string}, api:(path:string)=>Promise<unknown>, context:LegacyContext):Promise<string> } } }
export const legacy = window.GrowingLegacy;
