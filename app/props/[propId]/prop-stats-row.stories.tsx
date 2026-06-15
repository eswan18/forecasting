import type { Meta, StoryObj } from "@storybook/react-vite";
import PropStatsRow from "./prop-stats-row";

const meta = {
  title: "Prop/PropStatsRow",
  component: PropStatsRow,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    userForecast: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    average: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    min: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    max: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    forecasterCount: { control: "number" },
  },
} satisfies Meta<typeof PropStatsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

// A typical prop the user has already forecasted.
export const Default: Story = {
  args: {
    userForecast: 0.62,
    average: 0.55,
    forecasterCount: 7,
    min: 0.08,
    max: 0.91,
  },
};

// The user hasn't forecasted yet -> "Your Forecast" reads as a muted dash.
export const NoUserForecast: Story = {
  args: {
    userForecast: null,
    average: 0.44,
    forecasterCount: 5,
    min: 0.2,
    max: 0.7,
  },
};

// Nobody has forecasted -> every value collapses to a dash.
export const Empty: Story = {
  args: {
    userForecast: null,
    average: null,
    forecasterCount: 0,
    min: null,
    max: null,
  },
};

// A single forecaster -> min and max coincide.
export const SingleForecaster: Story = {
  args: {
    userForecast: 0.3,
    average: 0.3,
    forecasterCount: 1,
    min: 0.3,
    max: 0.3,
  },
};
