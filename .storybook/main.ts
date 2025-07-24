import type { StorybookConfig } from "@storybook/experimental-nextjs-vite";

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../app/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/experimental-addon-test",
    "@storybook/addon-themes"
  ],
  "framework": {
    "name": "@storybook/experimental-nextjs-vite",
    "options": {
      builder: {
        viteConfigPath: undefined,
      }
    }
  },
  "features": {
    experimentalRSC: true
  },
  "viteFinal": async (config) => {
    // Ensure proper alias resolution
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': new URL('../', import.meta.url).pathname,
    };
    return config;
  }
};
export default config;