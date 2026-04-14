import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

const projectRoot = __dirname;
const outputDirectory = resolve(projectRoot, "dist");

function copyManifestPlugin(): Plugin {
  return {
    name: "copy-manifest",
    closeBundle(): void {
      mkdirSync(outputDirectory, { recursive: true });
      copyFileSync(
        resolve(projectRoot, "manifest.json"),
        resolve(outputDirectory, "manifest.json")
      );
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyManifestPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(projectRoot, "src/pages/background/index.ts"),
        content: resolve(projectRoot, "src/pages/content/index.ts"),
        popup: resolve(projectRoot, "src/pages/popup/popup.html"),
        sidepanel: resolve(projectRoot, "src/pages/sidepanel/sidepanel.html"),
        options: resolve(projectRoot, "src/pages/options/options.html")
      },
      output: {
        entryFileNames(chunkInfo): string {
          if (chunkInfo.name === "background") {
            return "background.js";
          }

          if (chunkInfo.name === "content") {
            return "content.js";
          }

          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
