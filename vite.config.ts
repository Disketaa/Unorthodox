import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: "./",
  plugins: [preact()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./Source", import.meta.url)) },
  },
});
