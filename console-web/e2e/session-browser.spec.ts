import { expect, test } from '@playwright/test';
import { password, users } from './fixtures/local-users';
import { authenticate, capture, trackProblems } from './fixtures/browser-helpers';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('real browser rejects unbound child and parent management navigation without leaking originals', async ({ page }) => {
  const verify = trackProblems(page);
  await authenticate(page, 'parentB');
  await page.goto(`/console/students/${users.childA.id}`);
  await expect(page.getByText('此孩子未绑定到当前账号，请返回我的孩子核对。', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '查看原稿与点评', exact: true })).toHaveCount(0);
  await page.goto('/console/members');
  await expect(page).toHaveURL(/\/console\/403$/);
  expect((await page.request.get('/api/admin/members')).status()).toBe(403);
  expect((await page.request.get(`/api/parent/children/${users.childA.id}/handwriting`)).status()).toBe(404);
  await capture(page, 'parent-forbidden');
  verify();
});

test('real browser student and unconfirmed identities leave console for the existing flow', async ({ page }) => {
  await authenticate(page, 'childB');
  await page.goto('/console/home');
  await expect(page).toHaveURL('http://127.0.0.1:8791/');
  expect((await page.request.get('/api/admin/members')).status()).toBe(403);
  await authenticate(page, 'unknown');
  await page.goto('/console/home');
  await expect(page).toHaveURL(/\/\?choose-role=1$/);
  expect((await page.request.get('/api/parent/children')).status()).toBe(403);
});

test('real browser parent child switch ignores a delayed true response from the previous child', async ({ page }) => {
  await authenticate(page, 'parentA');
  await page.goto('/console/home');
  const picker = page.getByRole('combobox', { name: '选择孩子', exact: true });
  await expect(page.getByRole('heading', { name: users.childA.displayName + '的学习概况' })).toBeVisible();
  await picker.selectOption(users.childB.id);
  await expect(page.getByRole('heading', { name: users.childB.displayName + '的学习概况' })).toBeVisible();
  let ready!: () => void;
  let release!: () => void;
  let complete!: () => void;
  let transportError: string | undefined;
  const waiting = new Promise<void>(resolve => { ready = resolve; });
  const released = new Promise<void>(resolve => { release = resolve; });
  const completed = new Promise<void>(resolve => { complete = resolve; });
  await page.route(`**/api/parent/children/${users.childA.id}/report`, async route => {
    const response = await route.fetch(); ready(); await released;
    try { await route.fulfill({ response }); }
    catch { if (!route.request().failure()) transportError = 'Delayed transport failed without a recorded browser cancellation'; }
    finally { complete(); }
  });
  try {
    await picker.selectOption(users.childA.id);
    await waiting;
    await picker.selectOption(users.childB.id);
    await expect(page.getByRole('heading', { name: users.childB.displayName + '的学习概况' })).toBeVisible();
    release();
    await completed;
    expect(transportError).toBeUndefined();
    await expect(picker).toHaveValue(users.childB.id);
    await expect(page.getByRole('heading', { name: users.childA.displayName + '的学习概况' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: users.childB.displayName + '的学习概况' })).toBeVisible();
  } finally { release(); }
});

test('real Worker logout response delay cannot clear a newly logged-in browser Cookie', async ({ page }) => {
  await authenticate(page, 'parentA');
  await page.goto('/console/home');
  let ready!: () => void; let release!: () => void;
  const waiting = new Promise<void>(resolve => { ready = resolve; });
  const released = new Promise<void>(resolve => { release = resolve; });
  let loginRequests = 0;
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/auth/login') loginRequests++; });
  // Only transport timing changes: both auth operations still reach the real Worker
  // and D1. We forward its exact status/body/headers, including Set-Cookie.
  await page.route('**/api/auth/logout', async route => {
    const response = await route.fetch(); ready(); await released;
    await route.fulfill({ response });
  });
  try {
    await page.getByRole('button', { name: users.parentA.displayName, exact: true }).click();
    await page.getByText('退出登录', { exact: true }).click();
    await page.getByRole('button', { name: '确认', exact: true }).click();
    await waiting;
    await expect(page).toHaveURL(/\/console\/login/);
    // The global logout confirmation remains while its async action is pending.
    // Dismiss that presentation with Escape before using the real login form.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('textbox', { name: '用户名', exact: true }).fill(users.parentB.username);
    const secret = page.getByLabel('密码', { exact: true });
    await secret.fill(password);
    await page.getByRole('button', { name: '登录', exact: true }).click();
    // Naive UI's loading icon contributes "loading" to the button's accessible name.
    await expect(page.getByRole('button', { name: /登录$/ })).toHaveClass(/n-button--loading/);
    expect(loginRequests).toBe(0);
    release();
    await expect(page).toHaveURL(/\/console\/home$/);
    expect(loginRequests).toBe(1);
    const response = await page.request.get('/api/auth/me');
    const profile = await response.json();
    const native = await page.evaluate(async () => {
      const result = await fetch('/api/auth/me', { credentials: 'same-origin' });
      const body = await result.json(); return { status: result.status, id: body.id, role: body.role };
    });
    const cookies = await page.context().cookies();
    writeFileSync(resolve(process.cwd(), '../../.nmai/tmp/console-cookie-diagnostic.json'), JSON.stringify({ api: { status: response.status(), id: profile.id, role: profile.role }, native, cookies: cookies.map(({ name, expires, httpOnly, sameSite }) => ({ name, expires, httpOnly, sameSite })) }, null, 2));
    expect(native.status).toBe(200); expect(native.id).toBe(users.parentB.id);
    // route.fetch uses Playwright's API cookie jar, whose view after interception
    // differs from Chrome's in this timing experiment. Keep its diagnostic above;
    // the browser's own fetch and a real document reload are the authority here.
    await page.reload();
    await expect(page.getByRole('button', { name: users.parentB.displayName, exact: true })).toBeVisible();
    const restored = await page.evaluate(async () => {
      const result = await fetch('/api/auth/me', { credentials: 'same-origin' });
      const body = await result.json(); return { status: result.status, id: body.id };
    });
    expect(restored.status).toBe(200); expect(restored.id).toBe(users.parentB.id);
  } finally { release(); }
});
