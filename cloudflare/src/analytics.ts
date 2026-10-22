import { nowSql, type Statement, type Document } from "./database";
import { buildReport } from "./reports";
import { hash } from "./auth";

export function snapshotStatements(student: string, docs: Document[]): Statement[] {
  return buildReport(docs).subjects.map(s => ({ sql: `INSERT INTO "GrowingDailySnapshots" ("StudentId","Day","Subject","Read","Mastered","Practice")
    VALUES (?1,date('now','+8 hours'),?2,?3,?4,?5)
    ON CONFLICT ("StudentId","Day","Subject") DO UPDATE SET "Read"=excluded."Read","Mastered"=excluded."Mastered","Practice"=excluded."Practice","UpdatedAt"=${nowSql}`,
    params: [student, s.subject, s.read, s.mastered, s.practice] }));
}
export interface RewardEntry {
  documentKey: string; unit: string; hash: string; kind: "game" | "cash"; amount: number;
  claimedParent: string; claimedAt: string;
}
export async function rewardEntries(docs: Document[]) {
  const entries = new Map<string, RewardEntry>();
  const summaries: { unit: string; paidGame: number; paidCash: number; legacy: boolean }[] = [];
  let invalid = 0;
  for (const doc of docs) {
    if (!doc.key.startsWith("growing-unit-rewards-v1:") || !doc.value) continue;
    try {
      const data = JSON.parse(doc.value);
      if (data.version !== 1 || !Array.isArray(data.history)) { invalid++; continue; }
      const amount = (v: unknown, max: number) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= max ? v : 0;
      const unit = doc.key.split(":")[1];
      summaries.push({ unit, paidGame: amount(data.paidGame, 600000), paidCash: amount(data.paidCash, 10000000), legacy: data.history.some((h: any) => h?.legacy === true) });
      for (const h of data.history) {
        if (h?.legacy === true) continue; // Legacy totals have no authenticated actor.
        if (!h || !["game", "cash"].includes(h.kind) || !amount(h.amount, h.kind === "game" ? 600000 : 10000000) ||
            typeof h.parent !== "string" || !h.parent.trim() || h.parent.trim().length > 30 ||
            typeof h.at !== "number" || !Number.isSafeInteger(h.at) || h.at < 0 || h.at > 4102444800000) { invalid++; continue; }
        const identity = { documentKey: doc.key, kind: h.kind, amount: h.amount, claimedParent: h.parent.trim(), claimedAt: new Date(h.at).toISOString() };
        const entryHash = await hash(JSON.stringify(identity));
        entries.set(entryHash, { ...identity, unit, hash: entryHash });
      }
    } catch { invalid++; }
  }
  return { entries: [...entries.values()].sort((a, b) => b.claimedAt.localeCompare(a.claimedAt)), summaries, invalid };
}
