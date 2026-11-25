import path from "path";
import { defineConfig } from "vitest/config";

// Unit tests for pure logic in src/. No DOM: UI is checked by hand until a spec adds more.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
