import { loginPost } from './fixtures/login-pacing';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { password, users } from './fixtures/local-users';
import { authenticate, capture, trackProblems } from './fixtures/browser-helpers';
const headers = { 'X-Growing-Client': '1' };
const memberPath = `/api/admin/members/${users.actionChild.id}`;
async function signIn(request: APIRequestContext, username: string, secret = password) {
  return loginPost(request, { headers, data: { username, password: secret } });
}

test('member browser actions recheck binding, password sessions and role compare-and-swap', async ({ page, playwright }) => {
  const verify = trackProblems(page);
  await authenticate(page, 'admin');
  const parent = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:8791' });
  const student = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:8791' });
  try {
    expect((await signIn(parent, users.actionParent.username)).status()).toBe(200);
    expect((await page.request.post(`/api/admin/members/${users.actionParent.id}/children`, { headers, data: { studentId: users.actionChild.id } })).ok()).toBe(true);
    await page.goto(`/console/members/${users.actionParent.id}`);
    await page.getByRole('button', { name: '解绑', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText(users.actionChild.displayName);
    await page.getByRole('button', { name: '确认解绑', exact: true }).click();
    await expect(page.getByRole('button', { name: '解绑', exact: true })).toHaveCount(0);
    expect((await parent.get(`/api/parent/children/${users.actionChild.id}/report`)).status()).toBe(404);
    await page.getByRole('textbox', { name: '搜索学生账号或姓名', exact: true }).fill(users.actionChild.username);
    await page.getByRole('button', { name: '搜索学生', exact: true }).click();
    await page.getByRole('button', { name: '绑定', exact: true }).click();
    await expect(page.getByRole('button', { name: '解绑', exact: true })).toBeVisible();
    expect((await parent.get(`/api/parent/children/${users.actionChild.id}/report`)).status()).toBe(200);
    expect((await signIn(student, users.actionChild.username)).status()).toBe(200);
    await page.goto(`/console/members/${users.actionChild.id}`);
    const changed = 'LocalOnly_Changed_2026';
    await page.getByLabel('新密码', { exact: true }).fill(changed);
    await page.getByLabel('确认密码', { exact: true }).fill(changed);
    await page.getByRole('button', { name: '保存密码', exact: true }).click();
    await expect(page.getByText('密码已修改，该会员需重新登录', { exact: true })).toBeVisible();
    await expect(page.getByLabel('新密码', { exact: true })).toHaveValue('');
    expect((await student.get('/api/auth/me')).status()).toBe(401);
    expect((await signIn(student, users.actionChild.username)).status()).toBe(401);
    expect((await signIn(student, users.actionChild.username, changed)).status()).toBe(200);
    await page.getByRole('button', { name: '改为家长', exact: true }).click();
    await page.getByRole('button', { name: '确认更改', exact: true }).click();
    await expect(page.getByRole('button', { name: '改为学生', exact: true })).toBeVisible();
    expect((await student.get('/api/auth/me')).status()).toBe(401);
    expect((await parent.get(`/api/parent/children/${users.actionChild.id}/report`)).status()).toBe(404);
    const conflict = await page.request.post(memberPath + '/role', { headers, data: { expectedRole: 'Student', role: 'Parent' } });
    expect(conflict.status()).toBe(409);
    verify();
  } finally {
    const member = await (await page.request.get(memberPath)).json();
    if (member.member.role === 'Parent') await page.request.post(memberPath + '/role', { headers, data: { expectedRole: 'Parent', role: 'Student' } });
    await page.request.post(memberPath + '/password', { headers, data: { newPassword: password, confirmPassword: password } });
    await parent.dispose(); await student.dispose();
  }
});

test('parent mobile reward confirmation names child and records only one real ledger entry', async ({ page, playwright }) => {
  const administrator = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:8791' });
  try {
    expect((await signIn(administrator, users.admin.username)).status()).toBe(200);
    expect((await administrator.post(`/api/admin/members/${users.actionParent.id}/children`, { headers, data: { studentId: users.actionChild.id } })).ok()).toBe(true);
    await authenticate(page, 'actionParent');
    await page.goto(`/console/rewards?student=${users.actionChild.id}`);
    for (const width of [1280, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.getByRole('button', { name: '确认兑现', exact: true }).click();
      const preview = page.getByRole('dialog');
      await expect(preview).toContainText(users.actionChild.displayName);
      await page.keyboard.press('Tab');
      expect(await preview.evaluate(element => element.contains(document.activeElement))).toBe(true);
      await capture(page, `parent-${width}-reward-dialog`);
      await page.getByRole('button', { name: '取消', exact: true }).click();
    }
    await page.getByRole('button', { name: '确认兑现', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(users.actionChild.displayName);
    await expect(dialog).toContainText('9.00');
    await capture(page, 'parent-320-reward-dialog');
    await page.getByRole('button', { name: '确认已兑现', exact: true }).click();
    await expect(page.getByRole('button', { name: '确认兑现', exact: true })).toHaveCount(0);
    const rewards = await (await page.request.get(`/api/parent/children/${users.actionChild.id}/rewards`)).json();
    expect(rewards.confirmations.length).toBe(1);
    const entry = rewards.entries[0];
    const repeat = await page.request.post(`/api/parent/children/${users.actionChild.id}/confirm-redemption`, { headers, data: { documentKey: entry.documentKey, hash: entry.hash, confirm: true } });
    expect(repeat.status()).toBe(200);
    expect((await repeat.json()).alreadyConfirmed).toBe(true);
    const ledger = await (await administrator.get(`/api/admin/redemptions?student=${users.actionChild.id}`)).json();
    expect(ledger.total).toBe(1);
    expect(ledger.rows[0].amount).toBe(900);
    await capture(page, 'parent-320-reward-confirmed');
  } finally { await administrator.dispose(); }
});

test('parent browser add-child verifies credentials and clears the sensitive draft', async ({ page, playwright }) => {
  const admin = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:8791' });
  try {
    expect((await signIn(admin, users.admin.username)).status()).toBe(200);
    const unlink = await admin.delete(`/api/admin/members/${users.actionParent.id}/children/${users.actionChild.id}`, { headers });
    expect([200, 404].includes(unlink.status())).toBe(true);
    await authenticate(page, 'actionParent');
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/console/account');
    await page.getByRole('textbox', { name: '孩子用户名', exact: true }).fill(users.actionChild.username);
    await page.getByLabel('孩子密码', { exact: true }).fill(password);
    await page.getByRole('button', { name: '添加孩子', exact: true }).click();
    await expect(page.getByText('已添加孩子，正在刷新孩子列表。', { exact: true })).toBeVisible();
    await expect(page.getByLabel('孩子密码', { exact: true })).toHaveValue('');
    const children = await (await page.request.get('/api/parent/children')).json();
    expect(children.some((child: { id: string }) => child.id === users.actionChild.id)).toBe(true);
    await capture(page, 'parent-320-child-added');
  } finally { await admin.dispose(); }
});
