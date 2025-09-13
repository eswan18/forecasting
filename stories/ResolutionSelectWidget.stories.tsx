import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import ResolutionSelectWidget from "@/components/resolution-select-widget";

const meta = {
  title: "Example/ResolutionSelectWidget",
  component: ResolutionSelectWidget,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ResolutionSelectWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ResolvedTrue: Story = {
  args: {
    resolution: true,
    setResolution: () => {},
  },
};

export const ResolvedFalse: Story = {
  args: {
    resolution: false,
    setResolution: () => {},
  },
};

export const Unresolved: Story = {
  args: {
    resolution: undefined,
    setResolution: () => {},
  },
};

export const Small: Story = {
  args: {
    resolution: true,
    setResolution: () => {},
    size: "sm",
  },
};
