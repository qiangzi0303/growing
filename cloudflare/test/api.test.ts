import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { createHandler, type Env } from "../src/index";
import { connect, type Database, Store, nowSql } from "../src/database";
import { hash, passwordHash, verifyPassword } from "../src/auth";

const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: 'export default {fetch(){return new Response("ok")}}', compatibilityDate: '2026-10-22', d1Databases: ['DB'] }));
let db: Database;
const handler = createHandler(() => db);
const pg = { query: async <T = Record<string, any>>(sql: string, params: unknown[] = []) => ({ rows: await db.query<T>(sql, params) }) };
let limited = false;
const env = {
  ASSETS: { fetch: async (request: Request) => {
    const path = new URL(request.url).pathname;
    try {
      const file = await readFile(new URL("../public" + path, import.meta.url));
      return new Response(new Uint8Array(file), { headers: { "Content-Type": path.endsWith(".html") ? "text/html; charset=utf-8" : "text/javascript" } });
    } catch { return new Response("Not found", { status: 404 }); }
  } },
  AUTH_LIMITER: { limit: async () => ({ success: !limited }) },
} as unknown as Env;
const context = { waitUntil: (_promise: Promise<unknown>) => {} };
let counter = 0;
const password = "Test-Only-1987!";
async function call(path: string, method = "GET", data?: unknown, token?: string, extra: Record<string, string> = {}) {
  const request = new Request("https://learn.test" + path, { method, headers: { "X-Growing-Client": "1", "CF-Connecting-IP": "192.0.2.1", "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...extra }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  return handler(request, env, context);
}
async function register(role = "Student") {
  const name = "user_" + ++counter;
  const response = await call("/api/auth/register", "POST", { username: name, displayName: name, role, password });
  assert.equal(response.status, 200, await response.clone().text());
  return { ...await response.json() as any, name, response };
}
const invite = async (token: string) => (await (await call("/api/student/invitations", "POST", undefined, token)).json() as any).code;
before(async () => {
  db = connect(await mf.getD1Database('DB') as unknown as D1Database);
  const sql = await readFile(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8');
  const statements = sql.replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql}));
  await db.batch(statements); await db.batch(statements);
});
after(async () => { await mf.dispose(); });

test("password hashes are salted; correct password verifies and incorrect does not", async () => {
  const a = await passwordHash(password), b = await passwordHash(password);
  assert.notEqual(a, b); assert.ok(!a.includes(password));
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword("wrong-password", a), false);
});
test("registration, case-insensitive login, secure cookie, token hashing and logout", async () => {
  const student = await register();
  const cookie = student.response.headers.get("set-cookie")!;
  for (const flag of ["HttpOnly", "Secure", "SameSite=Lax"]) assert.ok(cookie.includes(flag));
  assert.equal((await handler(new Request("https://learn.test/api/auth/me", { headers: { Cookie: cookie.split(";")[0] } }), env, context)).status, 200);
  const rows = await pg.query<{ TokenHash: string }>('SELECT "TokenHash" FROM "GrowingSessions" WHERE "UserId"=?1', [student.user.id]);
  assert.notEqual(rows.rows[0].TokenHash, student.token); assert.equal(rows.rows[0].TokenHash, await hash(student.token));
  assert.equal((await call("/api/auth/login", "POST", { username: student.name.toUpperCase(), password })).status, 200);
  assert.equal((await call("/api/auth/login", "POST", { username: student.name, password: "incorrect-password" })).status, 401);
  assert.equal((await call("/api/auth/register", "POST", { username: student.name.toUpperCase(), displayName: "Duplicate", role: "Student", password })).status, 409);
  assert.equal((await call("/api/auth/logout", "POST", undefined, student.token)).status, 204);
  assert.equal((await call("/api/auth/me", "GET", undefined, student.token)).status, 401);
});
test("students are isolated; concurrent stale writes cannot overwrite and tombstones keep revisions", async () => {
  const a = await register(), b = await register(), path = "/api/student/state/growing-math-lessons-v1";
  const responses = await Promise.all([call(path, "PUT", { revision: 0, value: '{"topics":{"one":{"seen":true}}}' }, a.token), call(path, "PUT", { revision: 0, value: "{}" }, a.token)]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  assert.deepEqual(await (await call("/api/student/state", "GET", undefined, b.token)).json(), []);
  const first = await (await call("/api/student/state", "GET", undefined, a.token)).json() as any[];
  assert.equal(first[0].revision, 1); assert.ok(first[0].updatedAt.endsWith("Z"));
  assert.equal((await call(path, "PUT", { revision: 1, value: null }, a.token)).status, 200);
  const deleted = await (await call("/api/student/state", "GET", undefined, a.token)).json() as any[];
  assert.equal(deleted[0].revision, 2); assert.equal(deleted[0].value, null);
  assert.equal((await call(path, "PUT", { revision: 1, value: "{}" }, a.token)).status, 409);
});
test("parents need binding; concurrent invitation consumption has one winner; revocation works", async () => {
  const s = await register(), p = await register("Parent"), stranger = await register("Parent");
  const report = `/api/parent/children/${s.user.id}/report`;
  assert.equal((await call(report, "GET", undefined, p.token)).status, 404);
  const code = await invite(s.token);
  const results = await Promise.all([call("/api/parent/children", "POST", { code }, p.token), call("/api/parent/children", "POST", { code }, stranger.token)]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 400]);
  const parent = results[0].ok ? p : stranger, unbound = results[0].ok ? stranger : p;
  assert.equal((await call(report, "GET", undefined, parent.token)).status, 200);
  assert.equal((await call(report, "GET", undefined, unbound.token)).status, 404);
  assert.equal((await call("/api/student/state", "GET", undefined, parent.token)).status, 403);
  assert.equal((await call(`/api/student/parents/${parent.user.id}`, "DELETE", undefined, s.token)).status, 204);
  assert.equal((await call(report, "GET", undefined, parent.token)).status, 404);
  assert.equal((await call('/api/parent/children','POST',{code},parent.token)).status,400);
  assert.equal((await call(report, "GET", undefined, parent.token)).status, 404);
});
test("expired sessions and invitations cannot authenticate or bind", async () => {
  const s = await register(), p = await register("Parent"), code = await invite(s.token);
  await pg.query('UPDATE "GrowingInvitations" SET "ExpiresAt"=strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\',\'-1 second\') WHERE "CodeHash"=?1', [await hash(code)]);
  assert.equal((await call("/api/parent/children", "POST", { code }, p.token)).status, 400);
  await pg.query('UPDATE "GrowingSessions" SET "ExpiresAt"=strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\',\'-1 second\') WHERE "UserId"=?1', [s.user.id]);
  assert.equal((await call("/api/auth/me", "GET", undefined, s.token)).status, 401);
});
test("secret keys, connection settings, malformed/deep JSON and missing CSRF header are rejected", async () => {
  const s = await register();
  for (const [key, value, revision] of [
    ["growing-course-ai-v1", "{}", 0], ["growing-cloud-session-v1", "{}", 0],
    ["fraction-minute-v1", '{"connection":{"apiKey":"fake-test-only"}}', 0],
    ["fraction-minute-v1", "not json", 0], ["fraction-minute-v1", "[]", 0],
    ["fraction-minute-v1", "{}", -1], ["fraction-minute-v1", "{}", 0.5],
    ["fraction-minute-v1", '{"a":'.repeat(65) + '{}' + '}'.repeat(65), 0],
  ]) assert.equal((await call("/api/student/state/" + key, "PUT", { value, revision }, s.token)).status, 400);
  assert.equal((await call("/api/auth/logout", "POST", undefined, s.token, { "X-Growing-Client": "" })).status, 400);
  const oversized = new Request("https://learn.test/api/auth/login", { method: "POST", headers: { "X-Growing-Client": "1", "Content-Length": "2200001" }, body: "{}" });
  assert.equal((await handler(oversized, env, context)).status, 413);
});
test("document count is enforced with D1 atomic batches", async () => {
  const s = await register();
  await db.batch(Array.from({length:256},(_,n)=>({sql:`INSERT INTO "GrowingDocuments" ("StudentId","Key","Value","Revision","UpdatedAt") VALUES (?1,?2,'{}',1,${nowSql})`,params:[s.user.id,'existing-'+n]})));
  assert.equal((await call("/api/student/state/growing-math-lessons-v1", "PUT", { revision: 0, value: "{}" }, s.token)).status, 413);
  const concurrent=await register();
  await db.batch(Array.from({length:255},(_,n)=>({sql:`INSERT INTO "GrowingDocuments" ("StudentId","Key","Value","Revision","UpdatedAt") VALUES (?1,?2,'{}',1,${nowSql})`,params:[concurrent.user.id,'existing-'+n]})));
  const results=await Promise.all(['growing-math-lessons-v1','growing-physics-lessons-v1'].map(key=>call('/api/student/state/'+key,'PUT',{revision:0,value:'{}'},concurrent.token)));
  assert.deepEqual(results.map(r=>r.status).sort(),[200,413]);
  assert.equal((await new Store(db).state(concurrent.user.id)).length,256);
});

test('UTF-8 document byte limits prevent D1 oversized rows before writing',async()=>{
  const s=await register();
  const value=JSON.stringify({text:'汉'.repeat(700000)});
  assert.equal((await call('/api/student/state/growing-math-lessons-v1','PUT',{revision:0,value},s.token)).status,413);
  assert.deepEqual(await new Store(db).state(s.user.id),[]);
});
test("courses including encoded paths require a student and receive isolated-storage bootstrap", async () => {
  const p = await register("Parent"), s = await register();
  for (const path of ["/learn/app-design/index.html", "/%6cearn/app-design/index.html", "/learn%2fapp-design/index.html"]) {
    assert.equal((await call(path)).status, 401);
    assert.equal((await call(path, "GET", undefined, p.token)).status, 403);
    const response = await call(path, "GET", undefined, s.token);
    assert.equal(response.status, 200); assert.ok((await response.text()).includes('/cloud-storage.js'));
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
  assert.equal((await call("/learn/missing.html", "GET", undefined, s.token)).status, 404);
  assert.equal((await call("/")).status, 200);
});
test("native CORS is explicit and rate limiting rejects login attempts", async () => {
  for (const origin of ["https://appassets.androidplatform.net", "https://untrusted.example.org"]) {
    const response = await call("/api/auth/login", "OPTIONS", undefined, undefined, { Origin: origin });
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin.includes("appassets") ? origin : null);
  }
  limited = true;
  try { assert.equal((await call("/api/auth/login", "POST", { username: "unknown", password })).status, 429); } finally { limited = false; }
});
test("health checks runtime; readiness queries actual D1 tables", async () => {
  assert.equal((await (await call("/api/health")).json() as any).framework, "Cloudflare Workers");
  assert.equal((await call("/api/ready")).status, 200);
  const missing = await createHandler()(new Request("https://learn.test/api/ready"), env, context);
  assert.equal(missing.status, 503); assert.ok(!(await missing.text()).includes("postgres://"));
});
test("D1 rolls back all statements on a failed CAS and retries writes to different documents", async () => {
  const s=await register();
  const responses=await Promise.all([
    call('/api/student/state/growing-math-lessons-v1','PUT',{revision:0,value:'{"topics":{"a":{"seen":true}}}'},s.token),
    call('/api/student/state/growing-physics-lessons-v1','PUT',{revision:0,value:'{"topics":{"b":{"seen":true}}}'},s.token),
  ]);
  assert.deepEqual(responses.map(r=>r.status),[200,200]);
  assert.equal((await new Store(db).state(s.user.id)).length,2);
  await assert.rejects(db.batch([
    {sql:'UPDATE "GrowingDocuments" SET "Value"=\'{}\' WHERE "StudentId"=?1',params:[s.user.id]},
    {sql:'UPDATE "GrowingUsers" SET "SyncRevision"=-1 WHERE "Id"=?1',params:[s.user.id]},
  ]),/growing_sync_cas/);
  assert.ok((await new Store(db).state(s.user.id)).every(d=>d.value?.includes('seen')));
});

async function administrator() {
  const a = await register("Parent");
  await pg.query('INSERT INTO "GrowingAdministrators" ("UserId") VALUES (?1)', [a.user.id]);
  return a;
}
async function bindStudent(s: any, p: any) {
  assert.equal((await call('/api/parent/children', 'POST', { code: await invite(s.token) }, p.token)).status, 200);
}
test("admin grants are private, effective on existing sessions and revoked immediately", async () => {
  assert.equal((await call('/api/auth/register', 'POST', { username: 'public_admin', displayName: 'Admin', role: 'Admin', password })).status, 400);
  const s = await register(), p = await register('Parent'), a = await administrator();
  for (const token of [s.token,p.token]) for (const route of ['/overview','/members','/redemptions'])
    assert.equal((await call('/api/admin'+route,'GET',undefined,token)).status,403);
  assert.equal((await (await call('/api/auth/me','GET',undefined,a.token)).json() as any).role,'Admin');
  assert.equal((await (await call('/api/auth/login','POST',{username:a.name,password})).json() as any).user.role,'Admin');
  assert.equal((await call('/api/admin/overview','GET',undefined,a.token)).status,200);
  assert.equal((await call('/api/parent/children','GET',undefined,a.token)).status,200);
  assert.equal((await call('/learn/app-design/index.html','GET',undefined,a.token)).status,200);
  await pg.query('DELETE FROM "GrowingAdministrators" WHERE "UserId"=?1',[a.user.id]);
  assert.equal((await call('/api/admin/overview','GET',undefined,a.token)).status,403);
  assert.equal((await call('/learn/app-design/index.html','GET',undefined,a.token)).status,403);
});

test('admins view all courses and unbound student reports without impersonating students or parents',async()=>{
  const a=await administrator(),s=await register(),p=await register('Parent');
  for(const path of ['/learn/app-design/index.html','/%6cearn/app-design/index.html','/learn%2fapp-design/index.html']){
    const response=await call(path,'GET',undefined,a.token);
    assert.equal(response.status,200);
    assert.ok((await response.text()).includes('/cloud-storage.js'));
    assert.equal((await call(path,'HEAD',undefined,a.token)).status,200);
  }
  for(const suffix of ['report','growth?days=7','rewards']){
    const path='/api/parent/children/'+s.user.id+'/'+suffix;
    assert.equal((await call(path,'GET',undefined,a.token)).status,200);
    assert.equal((await call(path,'GET',undefined,p.token)).status,404);
    assert.equal((await call(path,'GET',undefined,s.token)).status,403);
  }
  assert.equal((await call('/api/parent/children/'+p.user.id+'/report','GET',undefined,a.token)).status,404);
  assert.equal((await call('/api/student/state','GET',undefined,a.token)).status,403);
  assert.equal((await call('/api/student/state/growing-math-lessons-v1','PUT',{revision:0,value:'{}'},a.token)).status,403);
  assert.equal((await call('/api/parent/children/'+s.user.id+'/confirm-redemption','POST',{},a.token)).status,403);
  await bindStudent(s,a);
  assert.equal((await (await call('/api/parent/children','GET',undefined,a.token)).json() as any[])[0].id,s.user.id);
  assert.deepEqual(await new Store(db).state(s.user.id),[]);
  await pg.query('DELETE FROM "GrowingAdministrators" WHERE "UserId"=?1',[a.user.id]);
  assert.equal((await call('/learn/app-design/index.html','GET',undefined,a.token)).status,403);
});
test("admin member filters, pagination and details expose safe profiles and family relationships", async () => {
  const a=await administrator(),s=await register(),p=await register('Parent');await bindStudent(s,p);
  let data=await (await call('/api/admin/members?q='+s.name+'&role=Student','GET',undefined,a.token)).json() as any;
  assert.equal(data.total,1);assert.equal(data.rows[0].id,s.user.id);assert.equal(data.rows[0].connections,1);assert.equal(data.rows[0].mastered,null);
  assert.ok(!JSON.stringify(data).match(/password|TokenHash|token/i));
  data=await (await call('/api/admin/members?role=Student','GET',undefined,a.token)).json() as any;
  assert.ok(data.rows.every((r:any)=>r.role==='Student'));assert.ok(data.rows.length<=20);
  for(let i=0;i<21;i++) {
    const name='page_'+(++counter);
    await pg.query('INSERT INTO "GrowingUsers" ("Id","Username","NormalizedName","DisplayName","Role","PasswordHash","CreatedAt") SELECT ?1,?2,upper(?2),?2,\'Student\',"PasswordHash",?4 FROM "GrowingUsers" WHERE "Id"=?3',[crypto.randomUUID(),name,s.user.id,new Date().toISOString()]);
  }
  const first=await (await call('/api/admin/members?role=Student&page=1','GET',undefined,a.token)).json() as any;
  const second=await (await call('/api/admin/members?role=Student&page=2','GET',undefined,a.token)).json() as any;
  assert.equal(first.rows.length,20);assert.ok(second.rows.length>0);assert.equal(first.total,second.total);
  assert.ok(second.rows.every((row:any)=>!first.rows.some((f:any)=>f.id===row.id)));
  assert.equal((await (await call('/api/admin/members?q='+s.name+'&page=2','GET',undefined,a.token)).json() as any).rows.length,0);
  assert.equal((await (await call('/api/admin/members/'+s.user.id,'GET',undefined,a.token)).json() as any).parents[0].id,p.user.id);
  assert.equal((await (await call('/api/admin/members/'+p.user.id,'GET',undefined,a.token)).json() as any).children[0].id,s.user.id);
  for(const route of ['/members?page=0','/members?role=Root','/members?q='+('x'.repeat(41)),'/redemptions?student=bad'])
    assert.equal((await call('/api/admin'+route,'GET',undefined,a.token)).status,400);
  assert.equal((await call('/api/admin/members/not-a-uuid','GET',undefined,a.token)).status,404);
  assert.equal((await call('/api/admin/students/'+p.user.id+'/report','GET',undefined,a.token)).status,404);
});
test("daily growth snapshots use Shanghai dates, preserve gaps and allow reset decreases", async () => {
  const a=await administrator(),s=await register(),p=await register('Parent');await bindStudent(s,p);
  const path='/api/student/state/growing-math-lessons-v1';
  const value=JSON.stringify({topics:{one:{seen:true,bestQuiz:3,attempts:[{score:9,feedback:'正确',criticalErrors:[]}]}}});
  assert.equal((await call(path,'PUT',{revision:0,value},s.token)).status,200);
  const snapshots=await pg.query<any>('SELECT "Day" AS day,"Mastered" AS mastered FROM "GrowingDailySnapshots" WHERE "StudentId"=?1',[s.user.id]);
  assert.equal(snapshots.rows.length,3);
  const today=new Date(Date.now()+8*3600000).toISOString().slice(0,10);assert.ok(snapshots.rows.every(r=>r.day===today));
  let data=await (await call('/api/admin/students/'+s.user.id+'/report?days=7','GET',undefined,a.token)).json() as any;
  assert.equal(data.growth.points.length,7);assert.equal(data.growth.points[0].subjects[0].mastered,null);
  assert.equal(data.growth.points[6].subjects[0].mastered,1);
  assert.equal((await call(path,'PUT',{revision:0,value:'{}'},s.token)).status,409);
  data=await (await call('/api/parent/children/'+s.user.id+'/growth?days=7','GET',undefined,p.token)).json() as any;
  assert.equal(data.points[6].subjects[0].mastered,1);
  assert.equal((await call(path,'PUT',{revision:1,value:'{}'},s.token)).status,200);
  const yesterday=new Date(Date.parse(today+'T00:00:00Z')-86400000).toISOString().slice(0,10);
  await call('/api/student/state/growing-activity-v1:'+crypto.randomUUID(),'PUT',{revision:0,value:JSON.stringify({days:{[yesterday]:{'数学':120}}})},s.token);
  data=await (await call('/api/admin/students/'+s.user.id+'/report?days=7','GET',undefined,a.token)).json() as any;
  assert.equal(data.growth.points[6].subjects[0].mastered,0);assert.equal(data.growth.points[5].subjects[0].mastered,null);assert.equal(data.growth.points[5].subjects[0].minutes,2);
  assert.equal((await call('/api/parent/children/'+s.user.id+'/growth?days=365','GET',undefined,p.token)).status,400);
});
test("parent confirmations verify stored rewards and binding, are idempotent and survive source deletion", async () => {
  const a=await administrator(),s=await register(),p=await register('Parent'),other=await register('Parent');await bindStudent(s,p);
  const key='growing-unit-rewards-v1:math-8a-03',prefix='/api/parent/children/'+s.user.id;
  const entry={kind:'cash',amount:250,parent:'自填妈妈',at:Date.now()};
  await call('/api/student/state/'+key,'PUT',{revision:0,value:JSON.stringify({version:1,paidCash:250,paidGame:5,history:[entry,entry,{legacy:true,cash:100},{kind:'cash',amount:-10,parent:'fake',at:1}]})},s.token);
  let data=await (await call(prefix+'/rewards','GET',undefined,p.token)).json() as any;
  assert.equal(data.entries.length,1);assert.equal(data.entries[0].confirmation,null);assert.equal(data.invalid,1);assert.equal(data.summaries[0].legacy,true);
  const payload={documentKey:key,hash:data.entries[0].hash,confirm:true,amount:999999,parentId:other.user.id};
  assert.equal((await call(prefix+'/rewards','GET',undefined,other.token)).status,404);
  assert.equal((await call(prefix+'/confirm-redemption','POST',payload,other.token)).status,404);
  for(const token of [s.token,a.token])assert.equal((await call(prefix+'/confirm-redemption','POST',payload,token)).status,403);
  assert.equal((await call(prefix+'/confirm-redemption','POST',{...payload,confirm:false},p.token)).status,400);
  assert.equal((await call(prefix+'/confirm-redemption','POST',{...payload,hash:'0'.repeat(64)},p.token)).status,409);
  const responses=await Promise.all([call(prefix+'/confirm-redemption','POST',payload,p.token),call(prefix+'/confirm-redemption','POST',payload,p.token)]);
  assert.ok(responses.every(r=>r.status===200));
  assert.deepEqual((await Promise.all(responses.map(r=>r.json() as any))).map(r=>r.alreadyConfirmed).sort(),[false,true]);
  data=await (await call(prefix+'/rewards','GET',undefined,p.token)).json() as any;
  assert.equal(data.confirmations.length,1);assert.equal(data.confirmations[0].amount,250);assert.equal(data.confirmations[0].parentId,p.user.id);assert.equal(data.entries[0].confirmation.parentName,p.user.displayName);
  await call('/api/student/state/'+key,'PUT',{revision:1,value:null},s.token);
  data=await (await call(prefix+'/rewards','GET',undefined,p.token)).json() as any;
  assert.equal(data.entries.length,0);assert.equal(data.confirmations.length,1);
  const ledger=await (await call('/api/admin/redemptions?student='+s.user.id+'&parent='+p.user.id,'GET',undefined,a.token)).json() as any;
  assert.equal(ledger.total,1);assert.equal(ledger.rows[0].parentUsername,p.name);
  const overview=await (await call('/api/admin/overview','GET',undefined,a.token)).json() as any;
  assert.ok(overview.confirmations>=1);assert.ok(overview.cashCents>=250);
  await call('/api/student/parents/'+p.user.id,'DELETE',undefined,s.token);
  assert.equal((await call(prefix+'/confirm-redemption','POST',payload,p.token)).status,404);
  assert.equal((await call(prefix+'/growth','GET',undefined,p.token)).status,404);
  assert.equal((await (await call('/api/admin/redemptions?student='+s.user.id,'GET',undefined,a.token)).json() as any).total,1);
});
