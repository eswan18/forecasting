import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { CompetitionTabs, type DashboardTab } from "./competition-tabs";

const meta = {
  title: "Competition/CompetitionTabs",
  component: CompetitionTabs,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  // Sit the tabs on a divider, as they appear under the competition header band.
  decorators: [
    (Story) => (
      <div className="border-b bg-card px-4 pt-2">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    activeTab: {
      control: "select",
      options: [
        "overview",
        "open",
        "closed",
        "resolved",
        "leaderboard",
        "members",
      ],
    },
    showMembersTab: { control: "boolean" },
    onTabChange: { control: false },
    stats: { control: false },
  },
  args: {
    activeTab: "overview",
    stats: { toForecast: 7, closed: 3, resolved: 12 },
    showMembersTab: false,
    onTabChange: () => {},
  },
} satisfies Meta<typeof CompetitionTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// Public competition — no Members tab.
export const Public: Story = {};

// Private competition — adds the Members tab.
export const Private: Story = {
  args: { showMembersTab: true },
};

// Leaderboard selected (a tab with no count badge).
export const LeaderboardActive: Story = {
  args: { activeTab: "leaderboard" },
};

// Clicking switches the active tab.
export const Interactive: Story = {
  render: (args) => {
    const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
    return (
      <CompetitionTabs
        {...args}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  },
};
