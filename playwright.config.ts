import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
  testMatch: /\.e2e\.ts$/,
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: {...devices["Desktop Chrome"], permissions: ["clipboard-write"]},
    },
    {
      name: "firefox",
      use: devices["Desktop Firefox"],
    },
    {
      name: "webkit",
      use: devices["Desktop Safari"],
      fullyParallel: false, // webkit races on the shared macOS pasteboard
    },
  ],
});
