import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "#": resolve(__dirname, "src"),
      // `server-only` throws on import outside a Next server build. Stub it so
      // the guard stays in the source instead of being dropped for testability.
      "server-only": resolve(__dirname, "tests/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000,
  },
});
