import type { Meta, StoryObj } from "@storybook/react-vite";

import { UserScores } from "./user-scores";
import { buildFlat, buildSections } from "./build-sections";
import {
  breakdownFixture,
  emptyBreakdownFixture,
} from "./user-scores.fixtures";

const shared = {
  competitionId: 6,
  competitionName: "2026 Open",
};

const meta = {
  title: "Competition/UserScores",
  component: UserScores,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof UserScores>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Someone else's sheet: worst category first, worst forecast inside it. */
export const OtherForecaster: Story = {
  args: {
    ...shared,
    userName: "Akshay Rangesh",
    isSelf: false,
    overallScore: breakdownFixture.overallScore,
    forecastCount: breakdownFixture.forecastScores.length,
    sections: buildSections(breakdownFixture),
    flat: buildFlat(breakdownFixture),
  },
};

/** Your own sheet — the heading is the only thing that changes. */
export const YourOwn: Story = {
  args: {
    ...OtherForecaster.args,
    userName: "Ethan Swan",
    isSelf: true,
  },
};

/** Nothing resolved yet. */
export const Empty: Story = {
  args: {
    ...shared,
    userName: "Ethan Swan",
    isSelf: true,
    overallScore: 0,
    forecastCount: 0,
    sections: buildSections(emptyBreakdownFixture),
    flat: buildFlat(emptyBreakdownFixture),
  },
};
