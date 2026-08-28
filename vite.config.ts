import { defineConfig } from "vite";
import { resolve } from "node:path";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

function copyExtensionAssets() {
  return {
    name: "copy-extension-assets",
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      mkdirSync(dist, { recursive: true });
      cpSync(
        resolve(__dirname, "apps/extension/manifest.json"),
        resolve(dist, "manifest.json"),
      );
      cpSync(resolve(__dirname, "apps/extension/icons"), resolve(dist, "icons"), {
        recursive: true,
      });

      for (const page of ["popup", "options"]) {
        const nested = resolve(dist, `apps/extension/${page}.html`);
        try {
          let html = readFileSync(nested, "utf8");
          html = html.replaceAll("../../", "./").replaceAll("../", "./");
          writeFileSync(resolve(dist, `${page}.html`), html);
        } catch {
          // page may already be flattened
        }
      }

      // Nested HTML tree is not needed at runtime.
      try {
        rmSync(resolve(dist, "apps"), { recursive: true, force: true });
      } catch {
        // ignore
      }
    },
  };
}

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "apps/extension/background.ts"),
        content: resolve(__dirname, "apps/extension/content.ts"),
        popup: resolve(__dirname, "apps/extension/popup.html"),
        options: resolve(__dirname, "apps/extension/options.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  plugins: [copyExtensionAssets()],
});
