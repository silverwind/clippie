import {defineConfig} from "vite";
import {fileURLToPath} from "node:url";
import dtsPlugin from "vite-plugin-dts";
import {stringPlugin} from "vite-string-plugin";

export default defineConfig({
  build: {
    outDir: fileURLToPath(new URL("dist", import.meta.url)),
    minify: false,
    sourcemap: false,
    target: "modules",
    emptyOutDir: true,
    chunkSizeWarningLimit: Infinity,
    assetsInlineLimit: 0,
    reportCompressedSize: false,
    lib: {
      entry: [fileURLToPath(new URL("index.ts", import.meta.url))],
      formats: ["es"],
    },
  },
  plugins: [
    dtsPlugin({exclude: [
      "*.config.*",
      "*.test.*",
    ]}),
    stringPlugin(),
  ],
});
