import type { Meta, StoryObj } from "@storybook/react-vite";
import { UpcomingDeadlines } from "./upcoming-deadlines";
import type { UpcomingDeadline } from "@/lib/db_actions/competition-stats";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

const deadlines: UpcomingDeadline[] = [
  {
    propId: 1,
    propText: "Will the Fed cut rates at its next meeting?",
    deadline: new Date(now - DAY),
    userForecast: null,
    userForecastId: null,
  },
  {
    propId: 2,
    propText: "Will the next Starship flight reach orbit?",
    deadline: new Date(now + DAY),
    userForecast: 0.72,
    userForecastId: 11,
  },
  {
    propId: 3,
    propText: "Will the home team make the playoffs this season?",
    deadline: new Date(now + 3 * DAY),
    userForecast: 0.18,
    userForecastId: 12,
  },
  {
    propId: 4,
    propText: "Will annual inflation come in under 3%?",
    deadline: new Date(now + 20 * DAY),
    userForecast: 0.55,
    userForecastId: 13,
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

// A mix: one overdue + unforecasted, the rest forecasted across the probability scale.
export const Default: Story = {};

// Every prop already has a forecast (each row shows "Edit").
export const AllForecasted: Story = {
  args: {
    deadlines: deadlines.map((d, i) => ({
      ...d,
      userForecast: [0.4, 0.72, 0.18, 0.55][i],
      userForecastId: 20 + i,
    })),
  },
};

// Nothing due — empty state.
export const Empty: Story = {
  args: { deadlines: [] },
};
