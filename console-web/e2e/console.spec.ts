import { loginPost } from './fixtures/login-pacing';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { password, users } from './fixtures/local-users';

async function login(request: APIRequestContext, account: keyof typeof users) {
  const response = await loginPost(request, {
    headers: { 'X-Growing-Client': '1' }, data: { username: users[account].username, password }
  });
  expect(response.status()).toBe(200);
}

test('real D1: parent bindings, management denial and logout invalidation', async ({ request }) => {
  await login(request, 'parentA');
  const children = await request.get('/api/parent/children');
  expect(children.status()).toBe(200);
  expect((await children.json()).map((child: {id: string}) => child.id).sort()).toEqual([users.childA.id, users.childB.id].sort());
  expect((await request.get('/api/admin/members')).status()).toBe(403);
  expect((await request.get(`/api/parent/children/${users.childA.id}/handwriting`)).status()).toBe(200);
  await request.post('/api/auth/logout', { headers: { 'X-Growing-Client': '1' } });
  expect((await request.get('/api/parent/children')).status()).toBe(401);
});

test('real D1: another parent cannot read either child or their original handwriting', async ({ request }) => {
  await login(request, 'parentB');
  for (const child of [users.childA, users.childB]) {
    // The Worker deliberately conceals the existence of unbound students.
    expect((await request.get(`/api/parent/children/${child.id}/report`)).status()).toBe(404);
    expect((await request.get(`/api/parent/children/${child.id}/handwriting`)).status()).toBe(404);
  }
});

test('real D1: administrator role comes from administrator membership', async ({ request }) => {
  await login(request, 'admin');
  const profile = await request.get('/api/auth/me');
  expect((await profile.json()).role).toBe('Admin');
  expect((await request.get('/api/admin/members')).status()).toBe(200);
});

test('parent browser login restores session on direct child detail refresh', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/console/login');
  await page.getByRole('textbox', { name: '用户名', exact: true }).fill(users.parentA.username);
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('密码', { exact: true })).toBeFocused();
  await page.getByLabel('密码', { exact: true }).fill(password);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page).toHaveURL(/\/console\/home$/);
  await page.goto(`/console/students/${users.childB.id}`);
  await expect(page.getByRole('heading', { name: users.childB.displayName + '的学习概况', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: users.childB.displayName + '的学习概况', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('empty parent has a functioning add-child entry', async ({ page }) => {
  await login(page.request, 'emptyParent');
  await page.goto('/console/account');
  await expect(page.getByRole('button', { name: /添加孩子/ })).toBeVisible();
});
