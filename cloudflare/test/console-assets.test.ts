import { test } from 'node:test';
import assert from 'node:assert/strict';
import { consoleAssets } from '../src/console-assets';
import { createHandler, type Env } from '../src/index';

function fixture() {
  const calls: string[] = [];
  const assets = { async fetch(request: Request) {
    const path = new URL(request.url).pathname;
    calls.push(path);
    const exists = ['/console/index.html', '/console/assets/app.js'].includes(path);
    return new Response(request.method === 'HEAD' ? null : path.endsWith('.html') ? 'console html' : 'javascript', { status: exists ? 200 : 404 });
  }};
  return { calls, assets };
}
test('bounded console pages fall back to the console index', async () => {
  for (const route of ['', 'home', 'students', 'students/a', 'reports', 'members', 'members/a', 'rewards', 'account', 'login', 'session-error', '403', '500']) {
    const path = '/console/' + route;
    const { calls, assets } = fixture();
    const response = await consoleAssets(new Request('https://test'+path), path, assets);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'console html');
    assert.equal(calls.at(-1), '/console/index.html');
  }
});
test('existing resources are served and missing assets or unknown pages never fall back', async () => {
  for (const path of ['/console/assets/app.js', '/console/assets/missing.js', '/console/unknown', '/console/students/a.js', '/console/students/a/b']) {
    const { calls, assets } = fixture();
    const response = await consoleAssets(new Request('https://test'+path), path, assets);
    assert.equal(response.status, path.endsWith('/app.js') ? 200 : 404);
    assert.deepEqual(calls, [path]);
  }
});
test('real handler integrates console fallback, HEAD, and existing rejection boundaries', async () => {
  const { calls, assets } = fixture();
  const env = { ASSETS: assets } as unknown as Env;
  const handler = createHandler(() => { throw new Error('database boundary'); });
  const run = (path: string, method='GET') => handler(new Request('https://test'+path, {method}), env, { waitUntil() {} });
  const response = await run('/console/students/a', 'HEAD');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
  assert.equal(calls.at(-1), '/console/index.html');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  for (const path of ['/console/assets/missing.js', '/console/unknown']) {
    const missing = await run(path);
    assert.equal(missing.status, 404);
    assert.notEqual(await missing.text(), 'console html');
  }
  for (const path of ['/console/%5csecret', '/console/students/a%2f..%2fb']) assert.equal((await run(path)).status, 400);
  const api = await run('/api/missing');
  assert.notEqual(await api.text(), 'console html');
  assert.equal((await run('/learn/index.html')).status, 503);
});
