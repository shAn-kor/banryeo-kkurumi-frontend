import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // The lifecycle wrapper supplies a throwaway self-signed certificate for
    // the local Vite server so public Secure session cookies remain testable.
    ignoreHTTPSErrors: baseURL.startsWith('https://127.0.0.1:'),
  },
  webServer: {
    command: 'npm run e2e:serve',
    url: baseURL,
    timeout: 60_000,
    reuseExistingServer: false,
    ignoreHTTPSErrors: baseURL.startsWith('https://127.0.0.1:'),
  },
});
