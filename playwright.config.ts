import { defineConfig, devices } from '@playwright/test';

const iphone = devices['iPhone 13'];

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:4173', trace: 'off' },
  webServer: { command: 'npm run build && npm run preview', port: 4173, reuseExistingServer: true, timeout: 180_000 },
  projects: [
    { name: 'iphone-portrait', testIgnore: /(hud|voice)\.spec/, use: { ...iphone, browserName: 'chromium' } },
    {
      name: 'iphone-landscape',
      use: { ...iphone, browserName: 'chromium', viewport: { width: iphone.viewport.height, height: iphone.viewport.width } }
    }
  ]
});
