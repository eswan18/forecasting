import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StatCards } from "./stat-cards";
import type { DashboardTab } from "./competition-tabs";

const meta = {
  title: "Competition/StatCards",
  component: StatCards,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    toForecast: { control: "number" },
    closed: { control: "number" },
    resolved: { control: "number" },
    activeTab: {
      control: "select",
      options: ["overview", "open", "closed", "resolved"],
      description: "Which tile is rendered in its selected state",
    },
    onTabChange: { control: false },
  },
  args: {
    toForecast: 7,
    closed: 3,
    resolved: 12,
    onTabChange: () => {},
  },
} satisfies Meta<typeof StatCards>;

export default meta;
type Story = StoryObj<typeof meta>;

// Clickable tiles, nothing selected (the overview default).
export const Default: Story = {};

// The "To Forecast" tile shown in its selected (indigo) state.
export const ActiveOpen: Story = {
  args: { activeTab: "open" },
};

// With no onTabChange the tiles render as plain, non-interactive cards.
export const Static: Story = {
  args: { onTabChange: undefined },
};

// Larger counts — checks tabular-figure alignment across tiles.
export const LargeNumbers: Story = {
  args: { toForecast: 142, closed: 28, resolved: 305 },
};

// Clicking a tile selects it.
export const Interactive: Story = {
  render: (args) => {
    const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
    return (
      <StatCards {...args} activeTab={activeTab} onTabChange={setActiveTab} />
    );
  },
};
