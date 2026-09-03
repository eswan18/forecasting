import type { Meta, StoryObj } from "@storybook/react-vite";

import { LayoutAxis } from "./layout-axis";
import { resolvedFixture, unresolvedFixture } from "./fixtures";

const meta = {
  title: "Props/PropList",
  component: LayoutAxis,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof LayoutAxis>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Past the deadline, awaiting a result: no outcome, no penalty, no third column. */
export const AwaitingResult: Story = {
  args: {
    props: unresolvedFixture,
    resolved: false,
    competitionName: "2026 Open",
    backHref: "/competitions/6",
    competitionId: 6,
  },
};

/** Settled: the truth marker, the tail to it, and what it cost. */
export const Resolved: Story = {
  args: {
    props: resolvedFixture,
    resolved: true,
    competitionName: "2026 Open",
    backHref: "/competitions/6",
    competitionId: 6,
  },
};

/** Nothing in this bucket yet. */
export const Empty: Story = {
  args: {
    props: [],
    resolved: false,
    competitionName: "2027 Open",
    backHref: "/competitions/9",
    competitionId: 9,
  },
};
