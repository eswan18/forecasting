import type { Meta, StoryObj } from "@storybook/react-vite";
import { UpcomingDeadlines } from "./upcoming-deadlines";
import type { UpcomingDeadline } from "@/lib/db_actions/competition-stats";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

const deadlines: UpcomingDeadline[] = [
  {
    propId: 1,
    propText: "Will the Fed cut rates at its next meeting?",
    kind: "binary",
    deadline: new Date(now - DAY),
    userForecast: null,
    userForecastId: null,
    hasUserForecast: false,
  },
  {
    propId: 2,
    propText: "Will the next Starship flight reach orbit?",
    kind: "binary",
    deadline: new Date(now + DAY),
    userForecast: 0.72,
    userForecastId: 11,
    hasUserForecast: true,
  },
  {
    propId: 3,
    propText: "Will the home team make the playoffs this season?",
    kind: "binary",
    deadline: new Date(now + 3 * DAY),
    userForecast: 0.18,
    userForecastId: 12,
    hasUserForecast: true,
  },
  // A choice prop the user has already filled in: no single probability to
  // show, so the chip is a check.
  {
    propId: 4,
    propText: "Who wins the NBA championship?",
    kind: "one_of",
    deadline: new Date(now + 5 * DAY),
    userForecast: null,
    userForecastId: 13,
    hasUserForecast: true,
  },
  // A choice prop still waiting on the user — the same muted dash a binary prop
  // gets.
  {
    propId: 5,
    propText: "Which of these bills pass this session?",
    kind: "any_of",
    deadline: new Date(now + 9 * DAY),
    userForecast: null,
    userForecastId: null,
    hasUserForecast: false,
  },
  {
    propId: 6,
    propText: "Will annual inflation come in under 3%?",
    kind: "binary",
    deadline: new Date(now + 20 * DAY),
    userForecast: 0.55,
    userForecastId: 14,
    hasUserForecast: true,
  },
];

const meta = {
  title: "Competition/UpcomingDeadlines",
  component: UpcomingDeadlines,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    deadlines: { control: false },
    onViewAll: { control: false },
  },
  args: {
    deadlines,
    competitionId: 6,
    onViewAll: () => {},
  },
} satisfies Meta<typeof UpcomingDeadlines>;

export default meta;
type Story = StoryObj<typeof meta>;

// A mix: one overdue + unforecasted, binary props across the probability scale,
// and two choice props (one forecasted, one not).
export const Default: Story = {};

// Every prop already has a forecast (each row shows "Edit"). Choice props keep
// a null probability — being forecasted is all their chip can say.
export const AllForecasted: Story = {
  args: {
    deadlines: deadlines.map((d, i) => ({
      ...d,
      userForecast: d.kind === "binary" ? [0.4, 0.72, 0.18, 0.55][i % 4] : null,
      userForecastId: 20 + i,
      hasUserForecast: true,
    })),
  },
};

// Nothing due — empty state.
export const Empty: Story = {
  args: { deadlines: [] },
};
