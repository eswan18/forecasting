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

/** Seasons still in play carry the big number; finished ones collapse to a row. */
export const InPlayOnly: Story = {
  args: {
    standings: standingsFixture.filter((s) => s.phase !== "final"),
    resolved: resolvedFixture,
  },
};

/** Forecasting has shut but props are still resolving: still featured, since the
 *  standing can still move. Closed is not over. */
export const StillScoring: Story = {
  args: {
    standings: standingsFixture.filter((s) => s.phase === "scoring"),
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
        phase: "live",
        isPrivate: false,
        leaders: [],
        you: null,
        fieldSize: 0,
      },
    ],
    resolved: [],
  },
};

/** Only public competitions, so the Private half is omitted entirely. */
export const PublicOnly: Story = {
  args: {
    standings: standingsFixture.filter((s) => !s.isPrivate),
    resolved: resolvedFixture,
  },
};

/** The first thing a brand-new account sees. */
export const Empty: Story = {
  args: { standings: [], resolved: [] },
};
