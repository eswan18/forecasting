import type { Meta, StoryObj } from "@storybook/react-vite";

import { DashboardView } from "./dashboard-view";
import { standingsFixture, resolvedFixture } from "./dashboard-view.fixtures";

const meta = {
  title: "Dashboard/DashboardView",
  component: DashboardView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DashboardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { standings: standingsFixture, resolved: resolvedFixture },
};

/** Open seasons carry the big number; closed ones collapse to a ruled row. */
export const OpenOnly: Story = {
  args: {
    standings: standingsFixture.filter((s) => s.open),
    resolved: resolvedFixture,
  },
};

/** Joined a competition but nothing has resolved yet, so there is no rank. */
export const Unscored: Story = {
  args: {
    standings: [
      {
        id: 9,
        name: "2027 Season",
        open: true,
        leaders: [],
        you: null,
        fieldSize: 0,
      },
    ],
    resolved: [],
  },
};

/** The first thing a brand-new account sees. */
export const Empty: Story = {
  args: { standings: [], resolved: [] },
};
