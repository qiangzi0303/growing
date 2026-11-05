import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  outputDir: '../../.nmai/tmp/console-e2e-results',
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8791',
    launchOptions: { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' },
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'pnpm exec tsx e2e/fixtures/start-local.mts',
    url: 'http://127.0.0.1:8791/console/login',
    reuseExistingServer: false,
    timeout: 120000
  }
});
