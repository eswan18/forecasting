import type { Meta, StoryObj } from "@storybook/react-vite";

import { Standings } from "./standings";
import {
  CURRENT_USER_ID,
  categoriesFixture,
  emptyScoresFixture,
  scoresFixture,
  smallScoresFixture,
} from "./standings.fixtures";

const shared = {
  categories: categoriesFixture,
  competitionId: 6,
  competitionName: "2026 Open",
  currentUserId: CURRENT_USER_ID,
};

const meta = {
  title: "Competition/Standings",
  component: Standings,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof Standings>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default board: complete forecasters only, one partial hidden. */
export const Default: Story = {
  args: {
    ...shared,
    scores: scoresFixture,
    toggleHref: "/competitions/6/standings?showIncomplete=1",
  },
};

/** Partial forecasters shown — note the best raw score is one of them. */
export const WithPartial: Story = {
  args: {
    ...shared,
    scores: scoresFixture,
    showIncomplete: true,
    toggleHref: "/competitions/6/standings",
  },
};

/** A two-person field, the narrowest the axis has to hold. */
export const SmallField: Story = {
  args: { ...shared, scores: smallScoresFixture },
};

/** Nothing resolved yet. */
export const Empty: Story = {
  args: { ...shared, scores: emptyScoresFixture },
};
