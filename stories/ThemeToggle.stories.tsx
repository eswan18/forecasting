import type { Meta, StoryObj } from "@storybook/react";

import ThemeToggle from "@/components/navbar/theme-toggle";

const meta = {
  title: "Navbar/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {}
};
