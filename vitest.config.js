import {defineConfig} from "vitest/config";
import {frontendTest} from "vitest-config-silverwind";

export default defineConfig({
  test: frontendTest({
    url: import.meta.url,
    environment: "jsdom", // happy-dom does not allow to modify navigator.clipboard
  }),
});
