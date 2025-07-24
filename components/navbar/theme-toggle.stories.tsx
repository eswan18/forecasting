import type { Meta, StoryObj } from '@storybook/react';
import ThemeToggle from './theme-toggle';
import { ThemeProvider } from 'next-themes';

// Wrapper to provide theme context
function ThemeToggleWrapper() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="p-4">
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}

const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggleWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeToggleWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InContext: Story = {
  render: () => (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="flex items-center gap-4 p-8 rounded-lg border">
        <span className="text-sm font-medium">Toggle theme:</span>
        <ThemeToggle />
      </div>
    </ThemeProvider>
  ),
};

export const MultipleInstances: Story = {
  render: () => (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <span className="text-sm">Header</span>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <span className="text-sm">Settings Panel</span>
          <ThemeToggle />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          All instances are synchronized
        </p>
      </div>
    </ThemeProvider>
  ),
};