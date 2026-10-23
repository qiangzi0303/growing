import { snapshotStatements } from "./analytics";
import { rankingStatements } from "./rankings";

export interface Statement { sql: string; params?: unknown[] }
export const nowSql = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

export interface Database {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  batch(statements: Statement[]): Promise<Record<string, any>[][]>;
  close(): Promise<void>;
}
export function connect(binding: D1Database): Database {
  const prepare = (sql: string, params: unknown[] = []) => {
    const statement = binding.prepare(sql);
    return params.length ? statement.bind(...params) : statement;
  };
  return {
    query: async <T>(sql: string, params: unknown[] = []) => (await prepare(sql, params).all<T>()).results,
    // D1 batch executes sequentially in one transaction and rolls back all on failure.
    batch: async statements => (await binding.batch<Record<string, any>>(statements.map(s => prepare(s.sql, s.params)))).map(r => r.results),
    close: async () => {},
  };
}

export interface User {
  id: string; username: string; displayName: string; role: "Student" | "Parent" | "Admin";
  passwordHash: string;
}
export interface Document {
  key: string; value: string | null; revision: number; updatedAt: string;
}
export class HttpError extends Error {
  constructor(public status: number, message: string, public extra: object = {}) { super(message); }
}
export function profile(user: User) {
  return { id: user.id, username: user.username, displayName: user.displayName, role: user.role };
}
const userFields = '"Id" AS id, "Username" AS username, "DisplayName" AS "displayName", CASE WHEN EXISTS (SELECT 1 FROM "GrowingAdministrators" a WHERE a."UserId"="GrowingUsers"."Id") THEN \'Admin\' ELSE "Role" END AS role, "PasswordHash" AS "passwordHash"';
const documentFields = '"Key" AS key, "Value" AS value, "Revision" AS revision, "UpdatedAt" AS "updatedAt"';
function documents(rows: Document[]): Document[] {
  return rows.map(row => ({ ...row, updatedAt: new Date(row.updatedAt).toISOString() }));
}
export class Store {
  constructor(public db: Database) {}
  async ready() {
    await this.db.query('SELECT "Id" FROM "GrowingUsers" LIMIT 1');
    for (const table of ['GrowingAdministrators','GrowingDailySnapshots','GrowingRewardConfirmations','GrowingRankings']) await this.db.query(`SELECT 1 FROM "${table}" LIMIT 0`);
  }
  async findUser(normalized: string) {
    return (await this.db.query<User>(`SELECT ${userFields} FROM "GrowingUsers" WHERE "NormalizedName"=?1`, [normalized]))[0];
  }
  async register(user: User) {
    try {
      await this.db.query(`INSERT INTO "GrowingUsers" ("Id","Username","NormalizedName","DisplayName","Role","PasswordHash","CreatedAt","SearchName") VALUES (?1,?2,?3,?4,?5,?6,${nowSql},?7)`,
        [user.id, user.username, user.username.toUpperCase(), user.displayName, user.role, user.passwordHash, user.displayName.toUpperCase()]);
    } catch (error) {
      if (String(error).includes('UNIQUE constraint failed: GrowingUsers.NormalizedName')) throw new HttpError(409, "用户名已被使用。");
      throw error;
    }
  }
  async createSession(hash: string, userId: string, expires: string) {
    await this.db.query('INSERT INTO "GrowingSessions" ("TokenHash","UserId","ExpiresAt") VALUES (?1,?2,?3)', [hash, userId, expires]);
  }
  async authenticate(hash: string) {
    return (await this.db.query<User>(`SELECT ${userFields} FROM "GrowingUsers" WHERE "Id"=(SELECT "UserId" FROM "GrowingSessions" WHERE "TokenHash"=?1 AND "ExpiresAt">${nowSql})`, [hash]))[0];
  }
  async logout(hash: string) { await this.db.query('DELETE FROM "GrowingSessions" WHERE "TokenHash"=?1', [hash]); }
  async state(student: string) {
    return documents(await this.db.query<Document>(`SELECT ${documentFields} FROM "GrowingDocuments" WHERE "StudentId"=?1`, [student]));
  }
  async save(student: string, key: string, value: string | null, revision: number) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const [users, rows] = await this.db.batch([
        { sql: 'SELECT "SyncRevision" AS version FROM "GrowingUsers" WHERE "Id"=?1', params: [student] },
        { sql: `SELECT ${documentFields} FROM "GrowingDocuments" WHERE "StudentId"=?1`, params: [student] },
      ]);
      if (!users.length) throw new HttpError(404, '未找到学生。');
      const state = documents(rows as Document[]), current = state.find(d => d.key === key);
      if ((current?.revision ?? 0) !== revision)
        throw new HttpError(409, "另一台设备已更新此记录，请选择保留版本。", { current: current ?? null });
      if (!current && state.length >= 256) throw new HttpError(413, "本账号的云存档份数已达上限，请联系管理员。");
      const bytes = (v: string | null) => v === null ? 0 : new TextEncoder().encode(v).byteLength;
      if (bytes(value) > 1_900_000) throw new HttpError(413, '单份云存档不能超过 1.9 MB。');
      if (state.filter(d => d.key !== key).reduce((sum, d) => sum + bytes(d.value), 0) + bytes(value) > 16_000_000)
        throw new HttpError(413, "本账号的云存档容量已达 16 MB，请联系管理员。");
      const next = [...state.filter(d => d.key !== key), { key, value, revision: revision + 1, updatedAt: new Date().toISOString() }];
      try {
        const result = await this.db.batch([
          // A failed student-wide CAS violates a named CHECK, rolling back the whole batch.
          // This covers different-document races, capacity checks and the computed snapshots.
          { sql: 'UPDATE "GrowingUsers" SET "SyncRevision"=CASE WHEN "SyncRevision"=?2 THEN "SyncRevision"+1 ELSE -1 END WHERE "Id"=?1', params: [student, users[0].version] },
          { sql: `INSERT INTO "GrowingDocuments" ("StudentId","Key","Value","Revision","UpdatedAt") VALUES (?1,?2,?3,?4,${nowSql})
            ON CONFLICT ("StudentId","Key") DO UPDATE SET "Value"=excluded."Value","Revision"=excluded."Revision","UpdatedAt"=excluded."UpdatedAt" RETURNING ${documentFields}`, params: [student, key, value, revision + 1] },
          ...(!key.startsWith('growing-handwriting-')?snapshotStatements(student, next):[]),
          ...(!key.startsWith('growing-activity-')&&!key.startsWith('growing-unit-rewards-')&&!key.startsWith('growing-handwriting-')?rankingStatements(student,next):[]),
        ]);
        return documents(result[1] as Document[])[0];
      } catch (e) { if (!String(e).includes('growing_sync_cas')) throw e; }
    }
    const current = (await this.state(student)).find(d => d.key === key) ?? null;
    throw new HttpError(409, '同步冲突，请重试或选择记录版本。', { current });
  }
  async invite(student: string, hash: string, expires: string) {
    await this.db.batch([
      { sql: 'DELETE FROM "GrowingInvitations" WHERE "StudentId"=?1 AND "UsedBy" IS NULL', params: [student] },
      { sql: 'INSERT INTO "GrowingInvitations" ("CodeHash","StudentId","ExpiresAt") VALUES (?1,?2,?3)', params: [hash, student, expires] },
    ]);
  }
  async bind(parent: string, hash: string) {
    const claim = crypto.randomUUID();
    const [rows] = await this.db.batch([
      { sql: `UPDATE "GrowingInvitations" SET "UsedBy"=?1,"ClaimId"=?3 WHERE "CodeHash"=?2 AND "UsedBy" IS NULL AND "ExpiresAt">${nowSql} RETURNING "StudentId" AS "studentId"`, params: [parent, hash, claim] },
      { sql: `INSERT INTO "GrowingFamilyLinks" ("ParentId","StudentId","CreatedAt") SELECT ?1,"StudentId",${nowSql} FROM "GrowingInvitations" WHERE "CodeHash"=?2 AND "ClaimId"=?3 ON CONFLICT DO NOTHING`, params: [parent, hash, claim] },
    ]);
    if (!rows[0]) throw new HttpError(400, "绑定码已失效或已被使用。");
    return rows[0];
  }
  async parents(student: string) {
    return this.db.query('SELECT u."Id" AS id,u."DisplayName" AS "displayName",l."CreatedAt" AS "createdAt" FROM "GrowingFamilyLinks" l JOIN "GrowingUsers" u ON u."Id"=l."ParentId" WHERE l."StudentId"=?1', [student]);
  }
  async children(parent: string) {
    return this.db.query('SELECT u."Id" AS id,u."DisplayName" AS "displayName",l."CreatedAt" AS "createdAt" FROM "GrowingFamilyLinks" l JOIN "GrowingUsers" u ON u."Id"=l."StudentId" WHERE l."ParentId"=?1', [parent]);
  }
  async revoke(student: string, parent: string) {
    const deleted = await this.db.query('DELETE FROM "GrowingFamilyLinks" WHERE "StudentId"=?1 AND "ParentId"=?2 RETURNING "ParentId"', [student, parent]);
    if (!deleted.length) throw new HttpError(404, "未找到绑定关系。");
  }
  async childState(parent: string, student: string) {
    // Authorization and data read in the same statement: revocation applies immediately.
    const [row] = await this.db.query('SELECT "StudentId" FROM "GrowingFamilyLinks" WHERE "ParentId"=?1 AND "StudentId"=?2', [parent, student]);
    if (!row) throw new HttpError(404, "未找到学生。");
    return documents(await this.db.query<Document>(`SELECT ${documentFields} FROM "GrowingDocuments" d WHERE d."StudentId"=?2 AND EXISTS (SELECT 1 FROM "GrowingFamilyLinks" WHERE "ParentId"=?1 AND "StudentId"=?2)`, [parent, student]));
  }
}
