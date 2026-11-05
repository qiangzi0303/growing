export interface InteractionSounds { attach(doc: Document): void; isEnabled(): boolean; setEnabled(value: boolean): Promise<boolean> }
declare global { interface Window { GrowingInteractionSounds?: InteractionSounds } }
export async function loadSounds(): Promise<InteractionSounds> {
 if (!window.GrowingInteractionSounds) { const path = '/interaction-sounds.js'; await import(/* @vite-ignore */ path); }
 if (!window.GrowingInteractionSounds) throw new Error('交互音效加载失败，请重试');
 window.GrowingInteractionSounds.attach(document); return window.GrowingInteractionSounds;
}
