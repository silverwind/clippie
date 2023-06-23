import {defineConfig} from "vitest/dist/config.js";
import {config} from "vitest-config-silverwind";

export default defineConfig({
  test: {
    ...config.test,
    environment: "jsdom",
  }
});
