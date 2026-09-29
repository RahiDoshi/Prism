import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/helpers/setup-env.ts"],
    hookTimeout: 120_000,
    testTimeout: 120_000,
    fileParallelism: false,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      "@dogfood/shared": new URL("./src/shared/src/index.ts", import.meta.url).pathname,
    },
  },
});
