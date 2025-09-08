import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./"),
    },
  },
  test: {
    name: "unit",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/stories/**",
    ],
    environment: "node",
    globals: true,
    globalSetup: ["./tests/globalSetup.ts"],
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 60000, // 60 seconds for testcontainer startup
    hookTimeout: 300000, // 5 minutes for setup/teardown hooks
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "stories/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData.ts",
        "components/ui/**", // Exclude UI components from coverage as they're tested in Storybook
      ],
    },
  },
});
