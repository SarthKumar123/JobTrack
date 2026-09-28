import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    proxy: Object.fromEntries(
      ["/api", "/oauth2", "/login"].map((path) => [
        path,
        {
          target: "http://localhost:8080",
          changeOrigin: false,
        },
      ]),
    ),
  },
  test: { environment: "jsdom", setupFiles: "./tests/setup.js" },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
