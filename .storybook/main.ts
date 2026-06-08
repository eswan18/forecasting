import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../app/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-themes",
    "@storybook/addon-docs",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    // Ensure proper alias resolution
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      // Mock DB-coupled server actions so components that import them can render
      // in Storybook without bundling the Postgres client or next/cache. The
      // more specific subpath must be listed before the barrel.
      "@/lib/db_actions/props": new URL(
        "./mocks/db_actions-props.ts",
        import.meta.url,
      ).pathname,
      "@/lib/db_actions": new URL("./mocks/db_actions.ts", import.meta.url)
        .pathname,
      // next/link's app-router internals trip a circular-import TDZ under Vite
      // dev; render a plain anchor instead.
      "next/link": new URL("./mocks/next-link.tsx", import.meta.url).pathname,
      ...config.resolve.alias,
      "@": new URL("../", import.meta.url).pathname,
    };

    // Ensure React is available globally
    config.define = {
      ...config.define,
      global: "globalThis",
    };

    return config;
  },
};
export default config;
