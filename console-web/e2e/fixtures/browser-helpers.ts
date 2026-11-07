import { loginPost } from './login-pacing';
import { expect, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { password, users } from './local-users';

export async function authenticate(page: Page, name: keyof typeof users) {
  writeFileSync(resolve(process.cwd(), '../../.nmai/tmp/console-e2e-runtime.json'), JSON.stringify({
    browser: page.context().browser()?.version(), executable: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    origin: 'http://127.0.0.1:8791', database: resolve(process.cwd(), '../../.nmai/tmp/unified-console-db'),
    command: 'pnpm --dir growing/console-web run test:e2e; webServer: pnpm exec tsx e2e/fixtures/start-local.mts'
  }, null, 2));
  const response = await loginPost(page.request, { headers: { 'X-Growing-Client': '1' }, data: { username: users[name].username, password } });
  expect(response.status()).toBe(200);
}
export async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  expect(await page.locator('main').evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth + 1))).toBe(true);
}
export function selectControl(page: Page, name: string) {
  return page.locator(`.n-select[aria-label="${name}"]`);
}
export async function choose(page: Page, name: string, label: string | number) {
  await selectControl(page, name).click();
  const options = page.locator('.n-base-select-option:visible');
  if (typeof label === 'number') await options.nth(label).click();
  else await options.getByText(label, { exact: true }).click();
}
export async function capture(page: Page, label: string) {
  await noOverflow(page);
  await page.screenshot({ path: resolve(process.cwd(), '../../.nmai/tmp', `console-stage3-${label}.png`), fullPage: true, animations: 'disabled' });
}
export function trackProblems(page: Page) {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const url = new URL(request.url());
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== 'http://127.0.0.1:8791') external.push(url.origin);
  });
  return () => { expect(errors).toEqual([]); expect(external).toEqual([]); };
}
