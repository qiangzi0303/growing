import { connect, Store, HttpError, profile, type Database, type User } from "./database";
import { hash, passwordHash, random, sessionCookie, sessionToken, verifyPassword } from "./auth";
import { buildReport } from "./reports";
import { Administration } from "./administration";
import { appRelease, type ReleaseEnv } from "./releases";
import { Rankings } from "./rankings";
import handwriting from '../../app/src/main/assets/web/app-design/handwriting-core.js';

export interface Env extends ReleaseEnv {
  ASSETS: Fetcher;
  DB?: D1Database;
  AUTH_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
}
const nativeOrigin = "https://appassets.androidplatform.net";
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const allowedKey = (key: string) => ["growing-math-lessons-v1", "growing-physics-lessons-v1", "fraction-minute-v1", "wordops_8A_unit3"].includes(key) ||
  /^growing-(english-course|unit-rewards)-v1:(english-8a-0[1-8]|math-8[ab]-\d{2}|physics-8a-0[1-5])$/.test(key) ||
  (key.startsWith("growing-activity-v1:") && uuid.test(key.slice("growing-activity-v1:".length))) || handwriting.KEY.test(key);
const json = (data: unknown, status = 200, headers?: HeadersInit) => Response.json(data, { status, headers });
const error = (status: number, message: string): never => { throw new HttpError(status, message); };
async function body(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get("Content-Length")) > 2_200_000) error(413, "请求内容过大。");
  if (!request.body) error(400, "请求内容为空。");
  const reader = request.body!.getReader(), decoder = new TextDecoder();
  let size = 0, text = "";
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 2_200_000) { await reader.cancel(); error(413, "请求内容过大。"); }
    text += decoder.decode(value, { stream: true });
  }
  try {
    const value = JSON.parse(text + decoder.decode());
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
  } catch { /* Fall through to a stable client error. */ }
  return error(400, "请求格式不正确。");
}
function validateDocument(key: string, value: unknown, revision: unknown) {
  if (!allowedKey(key) || !Number.isSafeInteger(revision) || Number(revision) < 0 || Number(revision) >= Number.MAX_SAFE_INTEGER ||
      (value !== null && (typeof value !== "string" || value.length > 1_000_000))) error(400, "不支持的学习记录或记录过大。");
  if (value === null) return;
  let data: any;
  try { data = JSON.parse(value as string); } catch { return error(400, "学习记录格式不正确。"); }
  if (!data || typeof data !== "object" || Array.isArray(data)) error(400, "学习记录必须是 JSON 对象。");
  const stack = [{ value: data, depth: 1 }];
  while (stack.length) {
    const item = stack.pop()!;
    if (item.depth > 64) error(400, "学习记录嵌套过深。");
    for (const child of Object.values(item.value)) if (child && typeof child === "object") stack.push({ value: child, depth: item.depth + 1 });
  }
  if (key === "fraction-minute-v1" && Object.hasOwn(data, "connection")) error(400, "请移除本机 AI 连接配置后再同步。");
  if (handwriting.KEY.test(key) && ((value as string).length > 900000 || !handwriting.validate(data))) error(400, '手写原稿格式无效或超过限制。');
}
export function createHandler(database: (env: Env) => Database = env => {
  if (!env.DB) error(503, "数据库尚未配置。");
  return connect(env.DB!);
}) {
  return async (request: Request, env: Env, ctx: Pick<ExecutionContext, "waitUntil">): Promise<Response> => {
    let db: Database | undefined;
    try {
      const url = new URL(request.url);
      if (url.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) { url.protocol = "https:"; return Response.redirect(url.toString(), 308); }
      let path: string;
      try { path = decodeURIComponent(url.pathname); } catch { return json({ error: "地址格式不正确。" }, 400); }
      if (/[\\\x00]/.test(path) || path.split("/").some(p => p === "." || p === "..")) return json({ error: "地址格式不正确。" }, 400);
      const api = path === "/api" || path.startsWith("/api/");
      if (request.method === "OPTIONS") return decorate(new Response(null, { status: 204 }), request);
      if (api && ["POST", "PUT", "DELETE"].includes(request.method) && request.headers.get("X-Growing-Client") !== "1") error(400, "请求缺少客户端标识。");
      if (path === "/api/health" && request.method === "GET") return decorate(json({ service: "Growing", framework: "Cloudflare Workers", database: "Cloudflare D1 (SQLite)", status: "running" }), request);
      if (path.startsWith('/downloads/') || path.startsWith('/api/releases/')) {
        db = database(env);
        return decorate(await appRelease(request, path, db, env), request);
      }
      if (!api && !path.startsWith("/learn/")) {
        if (!["GET", "HEAD"].includes(request.method)) error(405, "不支持的请求方法。");
        // Never let an encoded path be reinterpreted by Static Assets after authorization.
        url.pathname = path === "/" ? "/index.html" : path;
        return decorate(await env.ASSETS.fetch(new Request(url, request)), request);
      }
      db = database(env);
      const store = new Store(db);
      if (path === "/api/ready" && request.method === "GET") { await store.ready(); return decorate(json({ ready: true }), request); }
      const limited = (path === "/api/auth/register" || path === "/api/auth/login" || path === "/api/student/invitations" || path === "/api/parent/children") && request.method === "POST";
      if (limited) {
        const ip = request.headers.get("CF-Connecting-IP") ?? "local";
        if (!(await env.AUTH_LIMITER.limit({ key: "auth:" + ip })).success) error(429, "操作过于频繁，请稍后重试。");
      }
      if (request.method === "POST" && (path === "/api/auth/register" || path === "/api/auth/login")) {
        const data = await body(request);
        const name = typeof data.username === "string" ? data.username.trim() : "";
        if (typeof data.password !== "string" || data.password.length < 8 || data.password.length > 128 || !/^[\p{L}\p{N}_]{2,24}$/u.test(name)) error(path.endsWith("login") ? 401 : 400, "请输入有效的用户名和 8—128 位密码。");
        let user: User;
        if (path.endsWith("register")) {
          const display = typeof data.displayName === "string" ? data.displayName.trim() : "";
          if (!display || display.length > 40 || (data.role !== "Student" && data.role !== "Parent")) error(400, "请填写有效的姓名和身份。");
          user = { id: crypto.randomUUID(), username: name, displayName: display, role: data.role as User["role"], passwordHash: await passwordHash(data.password as string) };
          await store.register(user);
        } else {
          const found = await store.findUser(name.toUpperCase());
          const matched = found ? await verifyPassword(data.password as string, found.passwordHash) : (await passwordHash(data.password as string), false);
          if (!found || !matched) error(401, "用户名或密码不正确。");
          user = found!;
        }
        const token = random(32), expiresAt = new Date(Date.now() + 14 * 86400_000).toISOString();
        await store.createSession(await hash(token), user.id, expiresAt);
        return decorate(json({ user: profile(user), token, expiresAt }, 200, { "Set-Cookie": sessionCookie(token, request, expiresAt) }), request);
      }
      const token = sessionToken(request);
      const tokenHash = token && /^[a-f0-9]{64}$/i.test(token) ? await hash(token) : "";
      const user = tokenHash ? await store.authenticate(tokenHash) : undefined;
      if (!user) error(401, "云登录已失效，请重新登录。");
      const current = user!;
      if (path.startsWith("/api/admin/") && current.role !== "Admin") error(403, "需要管理员权限。");
      if (path.startsWith("/api/student/") && current.role !== "Student") error(403, "当前账号没有权限。");
      if (path.startsWith("/learn/") && current.role !== "Student" && current.role !== "Admin") error(403, "当前账号没有权限。");
      if (path.startsWith("/api/parent/") && current.role !== "Parent" && !(current.role === "Admin" && (request.method === "GET" || path === "/api/parent/children" && request.method === "POST"))) error(403, "当前账号没有权限。");
      let result: Response;
      const admin = new Administration(db);
      const childState = async (id: string) => {
        if (current.role !== 'Admin') return store.childState(current.id, id);
        await admin.requireStudent(id);
        return store.state(id);
      };
      const days = () => { const n = Number(url.searchParams.get('days') ?? 30); if (![7,30,90].includes(n)) error(400, '请选择 7、30 或 90 天。'); return n; };
      const page = () => { const n = Number(url.searchParams.get('page') ?? 1); if (!Number.isSafeInteger(n) || n < 1 || n > 100000) error(400, '页码无效。'); return n; };
      const rankings=new Rankings(db);
      const rankingResponse=async(id:string)=>{
        const board=url.searchParams.get('board');
        return json(board===null?await rankings.list(id):await rankings.board(id,board,page()));
      };
      if(path==='/api/student/rankings'&&request.method==='GET') result=await rankingResponse(current.id);
      else if(/^\/api\/(parent\/children|admin\/students)\/[^/]+\/rankings$/.test(path)&&request.method==='GET'){
        const id=path.split('/')[4];if(!uuid.test(id))error(404,'未找到学生。');
        await childState(id);result=await rankingResponse(id);
      }
      else if(/^\/api\/(parent\/children|admin\/students)\/[^/]+\/handwriting$/.test(path)&&request.method==='GET'){
        const id=path.split('/')[4];if(!uuid.test(id))error(404,'未找到学生。');
        const docs=(await childState(id)).filter(d=>handwriting.KEY.test(d.key)&&d.value!==null);
        const key=url.searchParams.get('key');
        if(key!==null){
          if(!handwriting.KEY.test(key))error(400,'手写记录编号无效。');
          const found=docs.find(d=>d.key===key);if(!found)error(404,'未找到手写原稿。');
          const original=JSON.parse(found!.value!);if(!handwriting.validate(original))error(400,'手写原稿无法读取。');
          result=json({key,original});
        }else{
          const rows=docs.flatMap(d=>{try{const original=JSON.parse(d.value!);if(!handwriting.validate(original))return [];return [{key:d.key,unitId:original.unitId,subject:original.subject,title:original.prompt.slice(0,120),pages:original.pages.length,updatedAt:original.updatedAt,grade:original.grades.filter((g:any)=>g.revision===original.revision).at(-1)??null}];}catch{return [];}}).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
          const n=page();result=json({page:n,pageSize:10,total:rows.length,rows:rows.slice((n-1)*10,n*10)});
        }
      }
      else if(path==='/api/admin/leaderboards/rebuild'&&request.method==='POST')result=json(await rankings.rebuild(page()));
      else if (path === '/api/admin/overview' && request.method === 'GET') result = json(await admin.overview());
      else if (path === '/api/admin/members' && request.method === 'GET') {
        const q = url.searchParams.get('q') ?? '', role = url.searchParams.get('role') ?? '';
        if (q.length > 40 || !['','Student','Parent','Admin'].includes(role)) error(400, '筛选条件无效。');
        result = json(await admin.members(q, role, page()));
      } else if (/^\/api\/admin\/members\/[^/]+$/.test(path) && request.method === 'GET') {
        const id = path.split('/')[4]; if (!uuid.test(id)) error(404, '未找到会员。');
        result = json(await admin.member(id));
      } else if (/^\/api\/admin\/students\/[^/]+\/report$/.test(path) && request.method === 'GET') {
        const id = path.split('/')[4]; if (!uuid.test(id)) error(404, '未找到学生。');
        result = json(await admin.studentReport(id, days()));
      } else if (path === '/api/admin/redemptions' && request.method === 'GET') {
        const student = url.searchParams.get('student') ?? '', parent = url.searchParams.get('parent') ?? '';
        if ((student && !uuid.test(student)) || (parent && !uuid.test(parent))) error(400, '会员编号无效。');
        result = json(await admin.confirmations(page(), student, parent));
      } else if (/^\/api\/parent\/children\/[^/]+\/(growth|rewards|confirm-redemption)$/.test(path)) {
        const id = path.split('/')[4]; if (!uuid.test(id)) error(404, '未找到学生。');
        if (path.endsWith('/confirm-redemption') && request.method === 'POST') {
          const data = await body(request);
          if (data.confirm !== true || typeof data.documentKey !== 'string' || !data.documentKey.startsWith('growing-unit-rewards-v1:') || !allowedKey(data.documentKey) || typeof data.hash !== 'string' || !/^[a-f0-9]{64}$/.test(data.hash)) error(400, '请核对并确认已实际兑现这笔记录。');
          result = json(await admin.confirm(current.id, id, data.documentKey as string, data.hash as string));
        } else if (request.method === 'GET' && !path.endsWith('/confirm-redemption')) {
          const docs = await childState(id);
          result = json(path.endsWith('/growth') ? await admin.growth(id, days(), buildReport(docs)) : await admin.rewards(id, docs));
        } else return decorate(json({ error: '不支持的请求方法。' }, 405), request);
      } else if (path.startsWith("/learn/")) {
        if (!["GET", "HEAD"].includes(request.method)) error(405, "不支持的请求方法。");
        url.pathname = path;
        result = await env.ASSETS.fetch(new Request(url, request));
        if (request.method !== "HEAD" && result.ok && result.headers.get("Content-Type")?.includes("text/html")) {
          const html = (await result.text()).replace(/<head\b[^>]*>/i, '$&<script src="/cloud-storage.js"></script>');
          const headers = new Headers(result.headers); headers.delete("Content-Length"); headers.delete("ETag"); headers.delete("Content-Encoding");
          result = new Response(html, { status: result.status, headers });
        }
      } else if (path === "/api/auth/me" && request.method === "GET") result = json(profile(current));
      else if (path === "/api/auth/logout" && request.method === "POST") { await store.logout(tokenHash); result = new Response(null, { status: 204, headers: { "Set-Cookie": sessionCookie("", request) } }); }
      else if (path === "/api/student/state" && request.method === "GET") result = json(await store.state(current.id));
      else if (path.startsWith("/api/student/state/") && request.method === "PUT") {
        const data = await body(request), key = path.slice("/api/student/state/".length);
        validateDocument(key, data.value, data.revision);
        result = json(await store.save(current.id, key, data.value as string | null, data.revision as number));
      } else if (path === "/api/student/invitations" && request.method === "POST") {
        const code = random(6).toUpperCase(), expiresAt = new Date(Date.now() + 600_000).toISOString();
        await store.invite(current.id, await hash(code), expiresAt); result = json({ code, expiresAt });
      } else if (path === "/api/student/parents" && request.method === "GET") result = json(await store.parents(current.id));
      else if (path.startsWith("/api/student/parents/") && request.method === "DELETE") {
        const id = path.slice("/api/student/parents/".length); if (!uuid.test(id)) error(404, "未找到家长。");
        await store.revoke(current.id, id); result = new Response(null, { status: 204 });
      } else if (path === "/api/parent/children" && request.method === "POST") {
        const data = await body(request), code = typeof data.code === "string" ? data.code.trim().toUpperCase() : "";
        if (!/^[a-f0-9]{12}$/i.test(code)) error(400, "请输入学生提供的 12 位绑定码。");
        result = json(await store.bind(current.id, await hash(code)));
      } else if (path === "/api/parent/children" && request.method === "GET") result = json(await store.children(current.id));
      else if (/^\/api\/parent\/children\/[^/]+\/report$/.test(path) && request.method === "GET") {
        const id = path.split("/")[4]; if (!uuid.test(id)) error(404, "未找到学生。");
        result = json(buildReport(await childState(id)));
      } else result = json({ error: "未找到接口。" }, 404);
      return decorate(result, request);
    } catch (e) {
      if (e instanceof HttpError) return decorate(json({ error: e.message, ...e.extra }, e.status), request);
      // Database errors may include SQL/connection details; do not expose or log them.
      const code = (e as { code?: unknown })?.code;
      console.error("Growing request failed", { code: typeof code === "string" && /^[A-Z0-9]{5}$/.test(code) ? code : "INTERNAL" });
      return decorate(json({ error: "服务暂不可用，请稍后重试。" }, 503), request);
    } finally {
      if (db) ctx.waitUntil(db.close().catch(() => undefined));
    }
  };
}
function decorate(response: Response, request: Request) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store"); headers.set("X-Content-Type-Options", "nosniff"); headers.set("Referrer-Policy", "same-origin");
  if (new URL(request.url).protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000");
  if (request.headers.get("Origin") === nativeOrigin) {
    headers.set("Access-Control-Allow-Origin", nativeOrigin);
    headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Growing-Client");
    headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    headers.append("Vary", "Origin");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
export default { fetch: createHandler() };
