import {defineConfig} from "vite";
import {webLib} from "vite-config-silverwind";

export default defineConfig(webLib({
  url: import.meta.url,
}));
