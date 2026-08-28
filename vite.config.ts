import { defineConfig } from "vite";
import { resolve } from "node:path";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

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

      // Vite emits popup.html under apps/extension/; expose it at dist root for MV3.
      const nestedPopup = resolve(dist, "apps/extension/popup.html");
      try {
        let html = readFileSync(nestedPopup, "utf8");
        // Nested HTML uses ../../ relative to apps/extension/; root copy needs ./
        html = html
          .replaceAll("../../", "./")
          .replaceAll("../", "./");
        writeFileSync(resolve(dist, "popup.html"), html);
      } catch {
        // popup may already be at root depending on Vite version/input handling
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
