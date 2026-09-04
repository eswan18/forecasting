import nextTypescript from "eslint-config-next/typescript";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...nextTypescript,
  ...nextCoreWebVitals,
  ...compat.extends("plugin:storybook/recommended"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      // The compiled migration runner: a generated bundle of kysely, pg and
      // migrations/, none of which this project lints at the source either.
      "dist/**",
      "next-env.d.ts",
      "coverage/**",
      "storybook-static/**",
      "migrations/**",
      "tests/helpers/000000000000_create-initial-schema.ts",
      // Git worktrees: full second checkouts of this repo, node_modules and
      // all. The ignores above are repo-relative, so without this every
      // dependency inside a worktree gets linted as project source.
      ".claude/worktrees/**",
    ],
  },
  {
    // Allow "any" types in test files
    files: ["**/*.test.ts", "**/*.test.tsx", "tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
