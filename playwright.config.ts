import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './Tests/Browser',
  timeout: 240_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
    trace: 'off',
    video: 'off',
  },
  webServer: [
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      port: 5173,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npx tsx Server/Relay.ts',
      port: 8080,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
