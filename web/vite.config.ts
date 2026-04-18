import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/explorer/",
  build: {
    outDir: resolve(__dirname, "../backend/web-dist"),
    emptyOutDir: true
  }
});
