import {defineConfig} from "vitest/config";
// @ts-ignore
import {frontend} from "vitest-config-silverwind";

export default defineConfig(frontend({
  url: import.meta.url,
  test: {
    environment: "jsdom", // happy-dom does not allow to modify navigator.clipboard
  },
}));
