import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export default defineConfig({
  resolve: {
    alias: {
      "@prepify/db": path.join(monorepoRoot, "packages/db/src/index.ts"),
      "@prepify/shared": path.join(
        monorepoRoot,
        "packages/shared/src/index.ts",
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 120_000,
  },
});
