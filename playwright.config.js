import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:4177", headless: true },
  webServer: {
    command: "npm run preview",
    url: "http://127.0.0.1:4177/hk-775/",
    reuseExistingServer: !process.env.CI,
  },
});
