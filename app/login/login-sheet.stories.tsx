import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoginSheet } from "./login-sheet";

const meta = {
  title: "Chrome/LoginSheet",
  component: LoginSheet,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof LoginSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

/** The identity provider handed back a refusal. */
export const Failed: Story = {
  args: { initialError: "The sign-in request expired. Please try again." },
};

/** The route's own loading state. */
export const Pending: Story = { args: { pending: true } };
