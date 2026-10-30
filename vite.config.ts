import { configDefaults, defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: "./",
  plugins: [preact()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./Source", import.meta.url)) },
  },
  server: {
    watch: {
      // Node's fs.watch throws EBUSY on these large GIFs on Windows, which kills the
      // dev server outright. They are never edited as source, so never watch them.
      ignored: ["**/*.gif"],
    },
  },
  test: {
    // Agent worktrees are whole copies of the project, so their tests would otherwise be
    // collected and run against this checkout's source.
    exclude: [...configDefaults.exclude, ".kilo/**", "Tests/Browser/**"],
  },
});
