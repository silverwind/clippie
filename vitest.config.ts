import {playwright} from "@vitest/browser-playwright";
import {defineConfig} from "vitest/config";
import {browser} from "vitest-config-silverwind";

export default defineConfig(browser({
  url: import.meta.url,
  test: {
    browser: {
      provider: playwright(),
      instances: [
        {browser: "chromium", provider: playwright({contextOptions: {permissions: ["clipboard-read", "clipboard-write"]}})},
        {browser: "firefox", provider: playwright({launchOptions: {firefoxUserPrefs: {"dom.events.testing.asyncClipboard": true}}})},
        {browser: "webkit", provider: playwright({contextOptions: {permissions: ["clipboard-read"]}})},
      ],
    },
  },
}));
