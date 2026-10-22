import { HttpError, type Database } from './database';

export interface ReleaseEnv { APK_FILES?: KVNamespace; APK_PUBLISH_TOKEN?: string }
interface StoredRelease { VersionCode: number; Filename: string; Sha256: string; SizeBytes: number; Manifest: string }
interface FileMetadata { sha256: string; sizeBytes: number }
const maxApk = 25 * 1024 * 1024;
const key = (sha: string) => 'apk:' + sha;
function fail(status: number, message: string): never { throw new HttpError(status, message); }

async function authorized(request: Request, expected?: string) {
  if (!expected) fail(503, 'APK 发布尚未配置。');
  const provided = request.headers.get('Authorization') ?? '';
  if (provided.length > 512 || !provided.startsWith('Bearer ')) fail(401, '发布凭据无效。');
  const encode = new TextEncoder();
  const hashes = await Promise.all([provided.slice(7), expected!].map(v => crypto.subtle.digest('SHA-256', encode.encode(v))));
  const a = new Uint8Array(hashes[0]), b = new Uint8Array(hashes[1]);
  let difference = 0; for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  if (difference) fail(401, '发布凭据无效。');
}

async function limitedBody(request: Request, limit: number) {
  if (Number(request.headers.get('Content-Length')) > limit) fail(413, '发布文件超过大小限制。');
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader(), parts: Uint8Array[] = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); fail(413, '发布文件超过大小限制。'); }
    parts.push(value);
  }
  const data = new Uint8Array(size); let offset = 0;
  for (const part of parts) { data.set(part, offset); offset += part.byteLength; }
  return data;
}

export async function appRelease(request: Request, path: string, db: Database, env: ReleaseEnv): Promise<Response> {
  const publishing = path.startsWith('/api/releases/');
  if (publishing) await authorized(request, env.APK_PUBLISH_TOKEN);
  if (!env.APK_FILES) fail(publishing ? 503 : 404, '安装包尚未发布。');
  const files = env.APK_FILES!;
  const upload = /^\/api\/releases\/files\/([a-f0-9]{64})\.apk$/.exec(path);
  if (upload && request.method === 'PUT') {
    const data = await limitedBody(request, maxApk);
    if (data.length < 4 || data[0] !== 80 || data[1] !== 75 || data[2] !== 3 || data[3] !== 4) fail(400, '安装包格式无效。');
    const sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data))).map(v => v.toString(16).padStart(2, '0')).join('');
    if (sha !== upload[1]) fail(400, '安装包校验和不匹配。');
    const existing = await files.getWithMetadata<FileMetadata>(key(sha), { type: 'stream' });
    if (existing.value) { await existing.value.cancel(); return Response.json({ uploaded: true, sha256: sha, sizeBytes: data.length }); }
    await files.put(key(sha), data, { metadata: { sha256: sha, sizeBytes: data.length } satisfies FileMetadata });
    return Response.json({ uploaded: true, sha256: sha, sizeBytes: data.length }, { status: 201 });
  }
  if (path === '/api/releases/publish' && request.method === 'POST') {
    let input: any;
    try { input = JSON.parse(new TextDecoder().decode(await limitedBody(request, 32_768))); }
    catch (e) { if (e instanceof HttpError) throw e; fail(400, '版本信息格式无效。'); }
    if (!input || input.schemaVersion !== 1 || input.packageName !== 'com.qiangzi0303.growing' ||
        !Number.isSafeInteger(input.versionCode) || input.versionCode < 1 || input.versionCode > 2147483647 ||
        typeof input.versionName !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(input.versionName) ||
        typeof input.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(input.sha256) ||
        !Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 4 || input.sizeBytes > maxApk ||
        typeof input.notes !== 'string' || input.notes.length > 4000) fail(400, '版本信息无效。');
    const filename = 'growing-' + input.versionName + '.apk';
    if (input.apkUrl !== filename) fail(400, '安装包必须使用本版本的同站文件名。');
    const file = await files.getWithMetadata<FileMetadata>(key(input.sha256), { type: 'stream' });
    if (!file.value) fail(503, '安装包尚未就绪，请稍后重试发布。');
    await file.value.cancel();
    if (file.metadata?.sha256 !== input.sha256 || file.metadata?.sizeBytes !== input.sizeBytes) fail(400, '版本信息与安装包不匹配。');
    const manifest = JSON.stringify({ schemaVersion: 1, packageName: input.packageName, versionCode: input.versionCode, versionName: input.versionName, apkUrl: filename, notes: input.notes, sha256: input.sha256, sizeBytes: input.sizeBytes });
    await db.query('INSERT INTO "GrowingAppReleases" ("VersionCode","VersionName","Filename","Sha256","SizeBytes","Manifest") VALUES (?1,?2,?3,?4,?5,?6) ON CONFLICT DO NOTHING', [input.versionCode,input.versionName,filename,input.sha256,input.sizeBytes,manifest]);
    const [saved] = await db.query<StoredRelease>('SELECT * FROM "GrowingAppReleases" WHERE "VersionCode"=?1', [input.versionCode]);
    if (!saved || saved.Filename !== filename || saved.Sha256 !== input.sha256 || saved.Manifest !== manifest) fail(409, '此版本已发布，不能替换为其他内容；请增加版本号。');
    return Response.json({ published: true, versionCode: saved.VersionCode, apkUrl: '/downloads/' + filename });
  }
  if (publishing) fail(405, '发布请求方法或路径无效。');
  if (!['GET', 'HEAD'].includes(request.method)) fail(405, '不支持的请求方法。');
  if (path === '/downloads/update.json') {
    const releases = await db.query<StoredRelease>('SELECT * FROM "GrowingAppReleases" ORDER BY "VersionCode" DESC LIMIT 5');
    // KV propagates across locations eventually. Advertise only a locally available APK.
    for (const release of releases) {
      const file = await files.getWithMetadata<FileMetadata>(key(release.Sha256), { type: 'stream' });
      if (!file.value) continue;
      await file.value.cancel();
      return new Response(request.method === 'HEAD' ? null : release.Manifest, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
    fail(releases.length ? 503 : 404, releases.length ? '安装包正在分发，请稍后重试。' : '安装包尚未发布。');
  }
  const download = /^\/downloads\/(growing-[A-Za-z0-9][A-Za-z0-9._-]{0,79}\.apk)$/.exec(path);
  if (download) {
    const [release] = await db.query<StoredRelease>('SELECT * FROM "GrowingAppReleases" WHERE "Filename"=?1', [download[1]]);
    if (!release) fail(404, '未找到安装包。');
    const etag = '"' + release.Sha256 + '"';
    if (request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers: { ETag: etag } });
    const file = await files.get(key(release.Sha256), { type: 'stream' });
    if (!file) fail(503, '安装包正在分发，请稍后重试。');
    if (request.method === 'HEAD') await file.cancel();
    return new Response(request.method === 'HEAD' ? null : file, { headers: {
      'Content-Type': 'application/vnd.android.package-archive', 'Content-Disposition': 'attachment; filename="' + release.Filename + '"',
      'Content-Length': String(release.SizeBytes), ETag: etag, 'Accept-Ranges': 'none', 'Cache-Control': 'no-store',
    } });
  }
  fail(404, '未找到下载文件。');
}
