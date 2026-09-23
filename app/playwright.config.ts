import { defineConfig } from "@playwright/test";
import os from "node:os";
import path from "node:path";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  retries: 0,
  timeout: 45000,
  outputDir: path.join(os.tmpdir(), "creative-hub-v2-browser-results"),
  use: {
    baseURL: "http://127.0.0.1:5274",
    channel: "msedge",
    headless: true,
    viewport: { width: 1500, height: 1000 },
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npx tsx tests/browserServer.ts",
      url: "http://127.0.0.1:8788/api/v2/state",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev:web",
      url: "http://127.0.0.1:5274",
      reuseExistingServer: false,
    },
  ],
});
