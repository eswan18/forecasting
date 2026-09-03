import type { Meta, StoryObj } from "@storybook/react-vite";

import { ForecastStats } from "./forecast-stats";
import { buildForecastStats } from "./build-stats";
import {
  CURRENT_USER_ID,
  emptyForecastsFixture,
  forecastsFixture,
} from "./forecast-stats.fixtures";

const shared = {
  competitionId: 6,
  competitionName: "2026 Open",
  currentUserId: CURRENT_USER_ID,
};

const meta = {
  title: "Competition/ForecastStats",
  component: ForecastStats,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof ForecastStats>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A live competition: one prop splits the room, one is near unanimous. */
export const Default: Story = {
  args: {
    data: buildForecastStats({ ...shared, forecasts: forecastsFixture }),
  },
};

/** The boldest-takes view, reached by ?view=boldest. */
export const BoldestTakes: Story = {
  args: {
    tab: "boldest",
    data: buildForecastStats({ ...shared, forecasts: forecastsFixture }),
  },
};

/** The certainty view, reached by ?view=certainty. */
export const Certainty: Story = {
  args: {
    tab: "certainty",
    data: buildForecastStats({ ...shared, forecasts: forecastsFixture }),
  },
};

/** Nobody has forecasted a binary prop yet. */
export const Empty: Story = {
  args: {
    data: buildForecastStats({ ...shared, forecasts: emptyForecastsFixture }),
  },
};
