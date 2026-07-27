import { defineConfig, devices } from "@playwright/test"

const port = 3100

export default defineConfig({
  testDir: "./tests/a11y",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 2 : 0,
  reporter: "list",
  workers: process.env["CI"] ? 2 : 4,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "reduced-motion",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  webServer: {
    command: `npm run start -- -p ${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
    url: `http://127.0.0.1:${port}`,
  },
})
