import { defineConfig } from "@playwright/test";

const port = 4174;
const baseURL = process.env.STAGED_BASE_URL ?? "http://127.0.0.1:" + port;
const chromePath = process.env.CHROME_PATH;

export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [["line"]],
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      args: [
        "--no-sandbox",
        "--enable-experimental-web-platform-features",
        "--enable-features=WebMCPTesting,DevToolsWebMCPSupport",
      ],
      ...(chromePath ? { executablePath: chromePath } : {}),
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "npm run build && npm run start -- --host 127.0.0.1 --port " + port,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
