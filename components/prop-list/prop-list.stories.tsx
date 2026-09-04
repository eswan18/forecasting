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
    buckets: {
      current: "awaiting" as const,
      counts: { awaiting: 5, resolved: 26 },
    },
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
    buckets: {
      current: "resolved" as const,
      counts: { awaiting: 6, resolved: 7 },
    },
    competitionId: 6,
  },
};

/**
 * Nothing has resolved yet. Both halves are still offered — the count says the
 * other one is empty before you go there — and the head is still the chooser.
 */
export const NothingResolvedYet: Story = {
  args: {
    props: unresolvedFixture,
    resolved: false,
    competitionName: "2026 Open",
    backHref: "/competitions/6",
    buckets: {
      current: "awaiting" as const,
      counts: { awaiting: 5, resolved: 0 },
    },
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
