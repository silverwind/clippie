import {webLib} from "tsdown-config-silverwind";
import {defineConfig} from "tsdown";

export default defineConfig(webLib({
  url: import.meta.url,
}));
