import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { FeatureToggle } from "./feature-toggle";

const meta = {
  title: "Admin/FeatureToggle",
  component: FeatureToggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    name: "Default",
    checked: true,
    onCheckedChange: fn(),
  },
} satisfies Meta<typeof FeatureToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {
  args: { checked: true },
};

export const Off: Story = {
  args: { checked: false },
};

/** Without an `onCheckedChange` handler the switch renders read-only. */
export const ReadOnly: Story = {
  args: { name: "Default", checked: true, onCheckedChange: undefined },
};

export const Unlabeled: Story = {
  args: { name: undefined, checked: false },
};
