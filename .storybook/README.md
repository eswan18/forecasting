# Storybook Setup for Next.js with React Server Components

This project uses Storybook 8.6 with experimental support for Next.js and React Server Components.

## Current Status

As of 2024/2025, Storybook has experimental support for React Server Components (RSC) through the `@storybook/experimental-nextjs-vite` framework. However, there are still some limitations:

### ✅ What Works

1. **Client Components** - All components marked with `"use client"` work perfectly in Storybook
2. **UI Components** - Pure presentational components work great
3. **Theme Support** - Light/dark mode switching is supported
4. **Hot Module Replacement** - Fast refresh works as expected
5. **TypeScript** - Full TypeScript support with type checking

### ⚠️ Limitations with Server Components

1. **Async Server Components** - Components that use `async/await` at the component level need special handling
2. **Server Actions** - `"use server"` functions don't work in Storybook environment
3. **Data Fetching** - Server-side data fetching needs to be mocked
4. **Dynamic Imports** - Some dynamic imports may not work as expected

## Best Practices

### 1. Focus on Client Components

For the best Storybook experience, focus on creating stories for:

- UI components (buttons, cards, forms, etc.)
- Client-side interactive components
- Layout components
- Pure presentational components

### 2. Handling Server Components

If you need to create stories for components that use server features:

```tsx
// Use the ServerComponentWrapper for async components
import { ServerComponentWrapper } from "@/.storybook/ServerComponentWrapper";

export const MyStory = {
  render: () => (
    <ServerComponentWrapper>
      <MyServerComponent />
    </ServerComponentWrapper>
  ),
};
```

### 3. Mocking Server Data

For components that expect server-fetched data:

```tsx
// Mock the data in your story
export const WithData = {
  args: {
    // Pass pre-fetched data as props
    data: mockData,
  },
};
```

### 4. Creating Stories

Stories are automatically discovered in these locations:

- `/stories/**/*.stories.tsx`
- `/components/**/*.stories.tsx`
- `/app/**/*.stories.tsx`

## Running Storybook

```bash
# Start Storybook dev server
npm run storybook

# Build Storybook for production
npm run build-storybook
```

## Example Story Structure

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { MyComponent } from "./MyComponent";

const meta = {
  title: "Category/ComponentName",
  component: MyComponent,
  parameters: {
    layout: "centered", // or 'fullscreen', 'padded'
  },
  tags: ["autodocs"], // Generates documentation automatically
  argTypes: {
    // Define controls for props
    variant: {
      control: "select",
      options: ["primary", "secondary"],
    },
  },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};
```

## Troubleshooting

### Component Not Rendering

- Ensure the component is a client component or properly wrapped
- Check for missing imports or dependencies
- Verify that async operations are properly handled

### Styling Issues

- Make sure `@/app/globals.css` is imported in `.storybook/preview.ts`
- Check that Tailwind classes are being processed
- Verify theme switching is working with the addon-themes

### Build Errors

- Clear the Storybook cache: `rm -rf node_modules/.cache/storybook`
- Ensure all dependencies are installed
- Check for TypeScript errors in your components

## Future Improvements

As Storybook's RSC support improves, we'll be able to:

- Create stories for async server components more easily
- Test server actions within Storybook
- Better integrate with Next.js App Router features

For now, focus on building a comprehensive component library for your client-side components, which will provide the most value for your development workflow.
