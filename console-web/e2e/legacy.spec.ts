import { loginPost } from './fixtures/login-pacing';
import { expect, test } from '@playwright/test';
import { authenticate, capture, trackProblems } from './fixtures/browser-helpers';
import { users, password } from './fixtures/local-users';

const paper = '13000000-0000-4000-8000-000000000301';
const legacy = (action: string, extra = '') => `/?legacy=1&action=${action}&return=%2Fconsole%2Faccount${extra}`;

for (const role of ['parentA', 'admin'] as const) for (const width of [1280, 320]) {
  test(`real legacy ${role} ${width}: designated child papers, refresh, return and settings`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const verify = trackProblems(page);
    await authenticate(page, role);
    await page.goto('/#learning-reports');
    await expect(page).toHaveURL(/\/console\/reports$/);
    await page.goto('/#question-bank');
    await expect(page.locator('[data-student]')).toBeVisible();
    await page.goto(legacy('question-bank', `&student=${users.childB.id}#question-bank`));
    await expect(page.locator('[data-student]')).toHaveValue(users.childB.id);
    await page.reload();
    await expect(page.locator('[data-student]')).toHaveValue(users.childB.id);
    await page.getByRole('link', { name: '返回后台', exact: true }).click();
    await expect(page).toHaveURL(/\/console\/account$/);
    await page.goto(legacy('my-papers', `&student=${users.childB.id}#my-papers`));
    await page.getByRole('button', { name: /孩子乙兼容深链卷/ }).click();
    await expect(page.locator('[data-paper-title]')).toHaveText('孩子乙兼容深链卷');
    await page.goto(legacy('my-papers', `&student=${users.childB.id}&paper=${paper}#my-papers`));
    await page.reload();
    await expect(page.locator('[data-paper-title]')).toHaveText('孩子乙兼容深链卷');
    await expect(page.locator('[data-student]')).toHaveValue(users.childB.id);
    await capture(page, `legacy-paper-${role}-${width}`);
    await page.getByRole('button', { name: '← 返回上一级', exact: true }).click();
    await expect(page).toHaveURL(/\/console\/account$/);
    await page.getByRole('button', { name: '音效：开', exact: true }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: '音效：关', exact: true })).toBeVisible();
    for (const name of ['DeepSeek 密钥设置', '语音 Key 设置']) {
      await page.getByRole('link', { name, exact: true }).click();
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
      expect(await page.evaluate(() => (window as any).GrowingInteractionSounds.isEnabled())).toBe(false);
      await capture(page, `legacy-settings-${name.startsWith('Deep') ? 'ai' : 'voice'}-${role}-${width}`);
      await page.getByRole('button', { name: '关闭', exact: true }).click();
      await expect(page).toHaveURL(/\/console\/account$/);
    }
    await page.goto(legacy('classroom'));
    if (role === 'admin') {
      await expect(page.getByRole('heading', { name: '学生课堂', exact: true })).toBeVisible();
      await page.evaluate(() => (window as any).GrowingCloud.storage().setItem('growing-math-lessons-v1', JSON.stringify({ localAcceptance: true })));
      expect(await page.evaluate(id => Boolean(localStorage.getItem(`growing-admin-preview:${id}:growing-math-lessons-v1`)), users.admin.id)).toBe(true);
      expect(await page.evaluate(id => localStorage.getItem(`growing-user:${id}:growing-math-lessons-v1`), users.childB.id)).toBeNull();
    } else await expect(page.locator('#message')).toContainText('当前账号没有课堂试用权限');
    await page.goto(legacy('settings', '&student='));
    await expect(page.getByRole('heading', { name: '无法打开兼容入口' })).toBeVisible();
    verify();
  });
}

test('real legacy register, role selection, bounded routing and missing assets', async ({ page }) => {
  await page.goto('/#register');
  await expect(page.getByRole('heading', { name: '创建云账号' })).toBeVisible();
  await authenticate(page, 'unknown');
  await page.goto('/?choose-role=1');
  await expect(page.getByRole('heading', { name: '请选择你的身份' })).toBeVisible();
  await authenticate(page, 'parentB');
  expect((await page.request.get(`/api/question-bank/papers/${paper}?studentId=${users.childB.id}`)).status()).toBe(404);
  for (const path of ['/console/assets/local-acceptance-missing.js', '/console/not-a-real-page']) {
    const response = await page.request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('<div id="app">');
  }
  expect((await page.request.get(`/console/students/${users.childB.id}`)).status()).toBe(200);
  const missingApi = await page.request.get('/api/local-acceptance-missing');
  expect(missingApi.status()).toBe(404);
  expect(await missingApi.text()).not.toContain('<div id="app">');
  const head = await page.request.head('/console/account');
  expect(head.status()).toBe(200);
  expect(await head.body()).toHaveLength(0);
  await page.goto('/console/account');
  await expect(page.getByRole('heading', { name: '账号与设置', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '账号与设置', exact: true })).toBeVisible();
});

test('real account settings stay isolated while device sound stays shared', async ({ page }) => {
  await authenticate(page, 'parentA');
  await page.goto(legacy('settings'));
  await page.locator('#course-ai-config input[name=apiKey]').fill('local-only-synthetic-not-a-real-key');
  await page.locator('#course-ai-config button[type=submit]').click();
  await expect(page.locator('#course-ai-config input[name=apiKey]')).toHaveValue('');
  expect(await page.evaluate(() => (window as any).GrowingCourseAI.info().configured)).toBe(true);
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('link', { name: '语音 Key 设置', exact: true }).click();
  await page.locator('.realtime-config input[name=apiKey]').fill('local-only-synthetic-voice-key');
  await page.locator('.realtime-config button[type=submit]').click();
  await expect(page.locator('.realtime-config input[name=apiKey]')).toHaveValue('');
  await authenticate(page, 'parentB');
  await page.goto(legacy('settings'));
  await expect(page.locator('#course-ai-config input[name=apiKey]')).toBeVisible();
  expect(await page.evaluate(() => (window as any).GrowingCourseAI.info().configured)).toBe(false);
  expect(await page.evaluate(() => Boolean((window as any).GrowingCloud.storage().getItem('growing-realtime-settings-v1')))).toBe(false);
  await authenticate(page, 'parentA');
  await page.goto(legacy('settings'));
  await expect(page.locator('#course-ai-config input[name=apiKey]')).toBeVisible();
  expect(await page.evaluate(() => (window as any).GrowingCourseAI.info().configured)).toBe(true);
  expect(await page.evaluate(() => Boolean((window as any).GrowingCloud.storage().getItem('growing-realtime-settings-v1')))).toBe(true);
});

test('real registration and both pending identity submissions enter the correct shell', async ({ page }) => {
  const username = `e2e_reg_${Date.now()}`;
  await page.goto('/#register');
  await page.locator('#auth input[name=username]').fill(username);
  await page.locator('#auth input[name=password]').fill(password);
  await page.locator('#auth input[name=displayName]').fill('注册验收家长');
  await page.locator('#auth select[name=role]').selectOption('Parent');
  const registered = page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/register');
  await page.getByRole('button', { name: '注册并登录', exact: true }).click();
  expect((await registered).status()).toBe(200);
  await expect(page).toHaveURL(/\/console\/home$/);
  const profile = await page.evaluate(async () => {
    const response = await fetch('/api/auth/me');
    const user = await response.json();
    return { status: response.status, username: user.username, role: user.role, pending: user.roleSelectionRequired };
  });
  expect(profile).toEqual({ status: 200, username, role: 'Parent', pending: false });
  for (const [account, role] of [['pendingParent', 'Parent'], ['pendingStudent', 'Student']] as const) {
    await authenticate(page, account);
    await page.goto('/?choose-role=1');
    await page.locator('#choose-role select[name=role]').selectOption(role);
    await page.getByRole('button', { name: '保存身份并继续', exact: true }).click();
    if (role === 'Parent') await expect(page).toHaveURL(/\/console\/home$/);
    else {
      await expect(page.getByRole('heading', { name: '请选择你的身份' })).toHaveCount(0);
      await expect(page.locator('#account-identity')).toContainText(users.pendingStudent.displayName);
      expect(new URL(page.url()).pathname).toBe('/');
    }
    expect(await page.evaluate(async () => {
      const response = await fetch('/api/auth/me'); const user = await response.json();
      return { status: response.status, role: user.role, pending: user.roleSelectionRequired };
    })).toEqual({ status: 200, role, pending: false });
  }
});

test('real Native bridge bearer session keeps Admin in old classroom shell', async ({ page, context }) => {
  const response = await loginPost(page.request, { headers: { 'X-Growing-Client': '1' }, data: { username: users.admin.username, password } });
  expect(response.status()).toBe(200);
  const session = await response.json();
  await context.addInitScript(({ token, user }) => {
    (window as any).GrowingNative = { cloudApiUrl: () => location.origin, confirmCloudSession: () => JSON.stringify({ ok: true }) };
    localStorage.setItem('growing-cloud-session-v1', JSON.stringify({ token, user }));
  }, { token: session.token, user: session.user });
  await page.goto(legacy('classroom'));
  await expect(page.getByRole('heading', { name: '学生课堂', exact: true })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/');
  await capture(page, 'legacy-native-bridge');
});
