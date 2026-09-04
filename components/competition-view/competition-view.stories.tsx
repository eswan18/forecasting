import type { Meta, StoryObj } from "@storybook/react-vite";

import { CompetitionOverview } from "./competition-overview";
import {
  CURRENT_USER_ID,
  NOW,
  finalSeason,
  midSeason,
  preSeason,
  privateSeason,
  scoringSeason,
} from "./fixtures";

const shared = { currentUserId: CURRENT_USER_ID, now: NOW };

const meta = {
  title: "Competition/Overview",
  component: CompetitionOverview,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof CompetitionOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The common case: results in, props still owed. */
export const MidSeason: Story = { args: { data: midSeason, ...shared } };

/** Just opened. Nothing scored, so the left column has no standing to print. */
export const PreSeason: Story = { args: { data: preSeason, ...shared } };

/** Forecasting shut, results still landing: nothing owed, scores still moving. */
export const Scoring: Story = { args: { data: scoringSeason, ...shared } };

/** Over. Every prop settled. */
export const Final: Story = { args: { data: finalSeason, ...shared } };

/** A two-person private group — the smallest field the layout has to hold. */
export const SmallPrivate: Story = { args: { data: privateSeason, ...shared } };
