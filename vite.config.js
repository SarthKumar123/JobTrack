import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  plugins: [react()],
  base: "./",
  test: { environment: "jsdom", setupFiles: "./tests/setup.js" },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
