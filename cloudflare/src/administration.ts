import { Store, HttpError, profile, nowSql, type Database, type User } from "./database";
import { buildReport } from "./reports";
import { rewardEntries } from "./analytics";
import { studyReport } from './study-time';

const roleSql = `CASE WHEN a."UserId" IS NOT NULL THEN 'Admin' ELSE u."Role" END`;
const memberFields = `u."Id" AS id,u."Username" AS username,u."DisplayName" AS "displayName",${roleSql} AS role,u."CreatedAt" AS "createdAt"`;
export class Administration {
  constructor(public db: Database) {}
  async overview() {
    const [counts] = await this.db.query(`SELECT count(*) AS members,
      count(*) FILTER (WHERE ${roleSql}='Student') AS students,
      count(*) FILTER (WHERE ${roleSql}='Parent') AS parents,
      count(*) FILTER (WHERE ${roleSql}='Admin') AS admins
      FROM "GrowingUsers" u LEFT JOIN "GrowingAdministrators" a ON a."UserId"=u."Id"`);
    const [activity] = await this.db.query(`SELECT count(DISTINCT "StudentId") AS "syncedThisWeek" FROM "GrowingDocuments" WHERE "UpdatedAt">strftime('%Y-%m-%dT%H:%M:%fZ','now','-7 days')`);
    const [rewards] = await this.db.query(`SELECT count(*) AS confirmations,
      COALESCE(sum("Amount") FILTER (WHERE "Kind"='game'),0) AS "gameMinutes",
      COALESCE(sum("Amount") FILTER (WHERE "Kind"='cash'),0) AS "cashCents" FROM "GrowingRewardConfirmations"`);
    return { ...counts, ...activity, ...rewards };
  }
  async members(search: string, role: string, page: number) {
    const filter = `FROM "GrowingUsers" u LEFT JOIN "GrowingAdministrators" a ON a."UserId"=u."Id"
      WHERE (?1='' OR instr(u."NormalizedName",?1)>0 OR instr(u."SearchName",?1)>0) AND (?2='' OR ${roleSql}=?2)`;
    search = search.toUpperCase();
    const [total] = await this.db.query(`SELECT count(*) AS total ${filter}`, [search, role]);
    const rows = await this.db.query(`SELECT ${memberFields},
      (SELECT max(d."UpdatedAt") FROM "GrowingDocuments" d WHERE d."StudentId"=u."Id") AS "lastSyncedAt",
      (SELECT count(*) FROM "GrowingFamilyLinks" f WHERE f."ParentId"=u."Id" OR f."StudentId"=u."Id") AS connections,
      (SELECT sum(s."Mastered") FROM "GrowingDailySnapshots" s WHERE s."StudentId"=u."Id" AND s."Day"=(SELECT max(t."Day") FROM "GrowingDailySnapshots" t WHERE t."StudentId"=u."Id")) AS mastered
      ${filter} ORDER BY u."CreatedAt" DESC,u."Id" LIMIT 20 OFFSET ?3`, [search, role, (page - 1) * 20]);
    return { ...total, page, pageSize: 20, rows };
  }
  async member(id: string) {
    const [member] = await this.db.query<User & { createdAt: string }>(`SELECT ${memberFields} FROM "GrowingUsers" u LEFT JOIN "GrowingAdministrators" a ON a."UserId"=u."Id" WHERE u."Id"=?1`, [id]);
    if (!member) throw new HttpError(404, "未找到会员。");
    const store = new Store(this.db);
    if (member.role === "Student") return { member, parents: await store.parents(id) };
    return { member, children: await store.children(id), confirmations: await this.confirmations(1, "", id) };
  }
  async requireStudent(id: string) {
    const [user] = await this.db.query<User>(`SELECT ${memberFields} FROM "GrowingUsers" u LEFT JOIN "GrowingAdministrators" a ON a."UserId"=u."Id" WHERE u."Id"=?1 AND ${roleSql}='Student'`, [id]);
    if (!user) throw new HttpError(404, "未找到学生。");
    return user;
  }
  async studentReport(id: string, days: number) {
    const student = await this.requireStudent(id);
    const docs = await new Store(this.db).state(id), report = await studyReport(this.db,id,docs);
    return { student: profile(student), report, growth: await this.growth(id, days, report), rewards: await this.rewards(id, docs) };
  }
  async growth(id: string, days: number, report?: ReturnType<typeof buildReport>) {
    report ??= await studyReport(this.db,id,await new Store(this.db).state(id));
    const end = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
    const begin = new Date(Date.parse(end + "T00:00:00Z") - (days - 1) * 86400000).toISOString().slice(0, 10);
    const rows = await this.db.query<any>(`SELECT "Day" AS day,"Subject" AS subject,"Read" AS read,"Mastered" AS mastered,"Practice" AS practice FROM "GrowingDailySnapshots" WHERE "StudentId"=?1 AND "Day">=?2 AND "Day"<=?3 ORDER BY "Day"`, [id, begin, end]);
    const lookup = new Map(rows.map(r => [r.day + r.subject, r]));
    const points = Array.from({ length: days }, (_, i) => {
      const day = new Date(Date.parse(begin + "T00:00:00Z") + i * 86400000).toISOString().slice(0, 10);
      return { day, subjects: report!.subjects.map(s => {
        const snapshot = lookup.get(day + s.subject);
        return { subject: s.subject, minutes: s.dailyMinutes[day] ?? 0, read: snapshot?.read ?? null, mastered: snapshot?.mastered ?? null, practice: snapshot?.practice ?? null };
      }) };
    });
    return { timezone: "Asia/Shanghai", points, note: "时长按北京时间汇总，已同步的每日时长独立保留。掌握和练习曲线为当天最后一次成功同步的快照，缺少快照的日期留空；重学或重置可能使掌握和练习数值下降。" };
  }
  async rewards(id: string, docs?: Awaited<ReturnType<Store["state"]>>) {
    const data = await rewardEntries(docs ?? await new Store(this.db).state(id));
    const confirmations = await this.db.query<any>(`SELECT c."Id" AS id,c."DocumentKey" AS "documentKey",c."EntryHash" AS hash,c."Kind" AS kind,c."Amount" AS amount,
      c."ClaimedParent" AS "claimedParent",c."ClaimedAt" AS "claimedAt",c."ConfirmedAt" AS "confirmedAt",p."DisplayName" AS "parentName",c."ParentId" AS "parentId"
      FROM "GrowingRewardConfirmations" c JOIN "GrowingUsers" p ON p."Id"=c."ParentId" WHERE c."StudentId"=?1 ORDER BY c."ConfirmedAt" DESC`, [id]);
    const matched = new Map(confirmations.map(c => [c.hash, c]));
    return { ...data, entries: data.entries.map(e => ({ ...e, confirmation: matched.get(e.hash) ?? null })), confirmations,
      note: "设备记录中的家长称呼未经云端身份验证。云端确认记录保存实际登录家长及确认时间，确认仅记账，不支付现金或控制游戏时长。" };
  }
  async confirm(parent: string, student: string, key: string, entryHash: string) {
    const linkSql = 'SELECT "StudentId" FROM "GrowingFamilyLinks" WHERE "ParentId"=?1 AND "StudentId"=?2';
    const existingSql = 'SELECT "Id" AS id FROM "GrowingRewardConfirmations" WHERE "StudentId"=?1 AND "DocumentKey"=?2 AND "EntryHash"=?3';
    const [links, existing, docs] = await this.db.batch([
      { sql: linkSql, params: [parent, student] },
      { sql: existingSql, params: [student, key, entryHash] },
      { sql: 'SELECT "Key" AS key,"Value" AS value,"Revision" AS revision FROM "GrowingDocuments" WHERE "StudentId"=?1 AND "Key"=?2', params: [student, key] },
    ]);
    if (!links.length) throw new HttpError(404, '未找到学生或绑定已解除。');
    if (existing.length) return { ...existing[0], alreadyConfirmed: true };
    const doc = docs[0];
    const entry = doc ? (await rewardEntries([doc as any])).entries.find(e => e.hash === entryHash) : undefined;
    if (!entry) throw new HttpError(409, '记录已变化，请刷新后重新核对。');
    // The INSERT itself rechecks authorization and the exact revision parsed above.
    const rows = await this.db.query(`INSERT INTO "GrowingRewardConfirmations" ("Id","StudentId","ParentId","DocumentKey","EntryHash","Kind","Amount","ClaimedParent","ClaimedAt")
      SELECT ?1,?2,?3,?4,?5,?6,?7,?8,?9
      WHERE EXISTS (SELECT 1 FROM "GrowingFamilyLinks" WHERE "StudentId"=?2 AND "ParentId"=?3)
      AND EXISTS (SELECT 1 FROM "GrowingDocuments" WHERE "StudentId"=?2 AND "Key"=?4 AND "Revision"=?10)
      ON CONFLICT ("StudentId","DocumentKey","EntryHash") DO NOTHING RETURNING "Id" AS id`,
      [crypto.randomUUID(), student, parent, key, entryHash, entry.kind, entry.amount, entry.claimedParent, entry.claimedAt, doc.revision]);
    if (rows.length) return { ...rows[0], alreadyConfirmed: false };
    const [stillLinked, confirmed] = await this.db.batch([{ sql: linkSql, params: [parent, student] }, { sql: existingSql, params: [student, key, entryHash] }]);
    if (!stillLinked.length) throw new HttpError(404, '未找到学生或绑定已解除。');
    if (confirmed.length) return { ...confirmed[0], alreadyConfirmed: true };
    throw new HttpError(409, '记录已变化，请刷新后重新核对。');
  }
  async confirmations(page: number, student = "", parent = "") {
    const filter = `FROM "GrowingRewardConfirmations" c JOIN "GrowingUsers" s ON s."Id"=c."StudentId" JOIN "GrowingUsers" p ON p."Id"=c."ParentId"
      WHERE (?1='' OR c."StudentId"=?1) AND (?2='' OR c."ParentId"=?2)`;
    const [total] = await this.db.query(`SELECT count(*) AS total ${filter}`, [student, parent]);
    const rows = await this.db.query(`SELECT c."Id" AS id,c."StudentId" AS "studentId",s."DisplayName" AS "studentName",p."DisplayName" AS "parentName",p."Username" AS "parentUsername",c."ParentId" AS "parentId",
      c."DocumentKey" AS "documentKey",c."Kind" AS kind,c."Amount" AS amount,c."ClaimedParent" AS "claimedParent",c."ClaimedAt" AS "claimedAt",c."ConfirmedAt" AS "confirmedAt"
      ${filter} ORDER BY c."ConfirmedAt" DESC,c."Id" LIMIT 20 OFFSET ?3`, [student, parent, (page - 1) * 20]);
    return { ...total, rows, page, pageSize: 20 };
  }
}
