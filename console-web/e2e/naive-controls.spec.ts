import { expect, test } from '@playwright/test';
import { users } from './fixtures/local-users';
import { authenticate, capture, choose, trackProblems } from './fixtures/browser-helpers';

test('Naive admin filters, retry, empty state and reward links preserve real requests', async ({ page }) => {
  const verify = trackProblems(page);
  await authenticate(page, 'admin');
  let fail = true;
  await page.route('**/api/admin/members?**', async route => {
    if (fail) await route.fulfill({ status: 503, json: { error: '验收临时加载失败' } });
    else await route.continue();
  });
  await page.goto('/console/students');
  await expect(page.locator('.n-alert')).toContainText('验收临时加载失败');
  fail = false;
  await page.getByRole('button', { name: '重试', exact: true }).click();
  await expect(page.locator('.n-data-table')).toBeVisible();
  await page.getByRole('textbox', { name: '姓名或账号', exact: true }).fill('no_such_student_naive');
  await page.getByRole('button', { name: '搜索学生', exact: true }).click();
  await expect(page.locator('.n-empty')).toContainText('没有匹配的学生');
  await page.goto('/console/reports');
  await page.getByRole('textbox', { name: '姓名或账号', exact: true }).fill(users.childA.username);
  await page.getByRole('button', { name: '搜索学生', exact: true }).click();
  await page.getByRole('button', { name: '查看报告', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('student=' + users.childA.id));
  await expect(page.getByRole('heading', { name: users.childA.displayName + '的学习概况' })).toBeVisible();
  await page.goto('/console/rewards');
  await choose(page, '搜索账号类型', '家长');
  await page.getByRole('textbox', { name: '搜索学生或家长', exact: true }).fill(users.parentA.username);
  await page.getByRole('button', { name: '搜索账号', exact: true }).click();
  await page.getByRole('button', { name: '按此账号筛选', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('parent=' + users.parentA.id));
  await page.reload();
  await expect(page.getByRole('heading', { name: '云端确认账本', exact: true })).toBeVisible();
  await capture(page, 'naive-admin-filters'); verify();
});

for (const width of [1280, 320]) {
  test(`Naive parent reward dialog, child selection and sound switch at ${width}`, async ({ page }) => {
    const verify = trackProblems(page);
    await page.setViewportSize({ width, height: 900 });
    await authenticate(page, 'parentA');
    await page.goto(`/console/rewards?student=${users.childA.id}`);
    await page.getByRole('button', { name: '确认兑现', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(users.childA.displayName);
    await expect(dialog).toContainText('不会自动转账');
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    await capture(page, `naive-parent-${width}-dialog`);
    await page.getByRole('button', { name: '取消', exact: true }).click();
    await choose(page, '选择奖励孩子', users.childB.displayName);
    await expect(page).toHaveURL(new RegExp('student=' + users.childB.id));
    await expect(page.getByRole('button', { name: '确认兑现', exact: true })).toHaveCount(0);
    await page.goto('/console/account');
    const sound = page.getByRole('switch', { name: '交互音效', exact: true });
    await expect(sound).toBeVisible();
    const initial = await sound.getAttribute('aria-checked');
    await sound.click();
    await expect(sound).toHaveAttribute('aria-checked', initial === 'true' ? 'false' : 'true');
    await capture(page, `naive-parent-${width}-account`); verify();
  });
}
