import { defineConfig } from "@playwright/test";

const port = process.env.PORTFOLIO_PREVIEW_PORT || 4177;
export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: { baseURL: `http://127.0.0.1:${port}`, headless: true },
  webServer: {
    command: "npm run preview",
    url: `http://127.0.0.1:${port}/hk-775/`,
    reuseExistingServer: !process.env.CI,
  },
});
