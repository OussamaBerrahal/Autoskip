import { build } from "vite";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
const watch = process.argv.includes("--watch");
rmSync("dist", { recursive: true, force: true });
await build({ build: { watch: watch ? {} : null } });
// Manifest content scripts are classic scripts. Build one self-contained IIFE.
await build({
  configFile: false,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: false,
    watch: watch ? {} : null,
    lib: {
      entry: resolve("apps/extension/content.ts"),
      name: "AutoSkip",
      formats: ["iife"],
      fileName: () => "content.js",
    },
  },
});
if (!watch) await import("./verify-package.mjs");
