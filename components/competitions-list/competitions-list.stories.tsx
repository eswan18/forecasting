import type { Meta, StoryObj } from "@storybook/react-vite";

import { CompetitionsList, type SeasonRow } from "./competitions-list";

const NOW = new Date(Date.UTC(2026, 8, 2));
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

const seasons: SeasonRow[] = [
  {
    id: 6,
    name: "2026 Open",
    status: "forecasts-open",
    isPrivate: false,
    forecastsClose: day(6),
    end: day(120),
  },
  {
    id: 9,
    name: "Swan Family Pool",
    status: "private",
    isPrivate: true,
    forecastsClose: null,
    end: null,
  },
  {
    id: 5,
    name: "2025 Open",
    status: "forecasts-closed",
    isPrivate: false,
    forecastsClose: day(-260),
    end: day(-30),
  },
  {
    id: 4,
    name: "2024 Open",
    status: "ended",
    isPrivate: false,
    forecastsClose: day(-620),
    end: day(-395),
  },
  {
    id: 3,
    name: "2023 Open",
    status: "ended",
    isPrivate: false,
    forecastsClose: day(-985),
    end: day(-760),
  },
];

const meta = {
  title: "Competition/CompetitionsList",
  component: CompetitionsList,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof CompetitionsList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What a forecaster sees: live seasons, then scoring, then settled. */
export const Default: Story = { args: { seasons, now: NOW } };

/** An admin also sees a season that has not opened yet. */
export const AsAdmin: Story = {
  args: {
    now: NOW,
    seasons: [
      {
        id: 7,
        name: "2027 Open",
        status: "upcoming",
        isPrivate: false,
        forecastsClose: day(200),
        end: day(320),
      },
      ...seasons,
    ],
  },
};

/** A brand new install. */
export const Empty: Story = { args: { seasons: [], now: NOW } };
