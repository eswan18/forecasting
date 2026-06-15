import type { Meta, StoryObj } from "@storybook/react-vite";
import ForecastDistributionChart from "./forecast-distribution-chart";
import { sampleForecasts, average, makeForecast } from "./prop-views.fixtures";

const meta = {
  title: "Prop/ForecastDistributionChart",
  component: ForecastDistributionChart,
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
    forecasts: { control: false },
    userForecast: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    average: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
  },
} satisfies Meta<typeof ForecastDistributionChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// Histogram with the KDE overlay; the user's bucket is the indigo bar and the
// "you" / "avg" markers sit on the rail below.
export const Default: Story = {
  args: {
    forecasts: sampleForecasts,
    userForecast: 0.52,
    average: average(sampleForecasts),
  },
};

// The user hasn't forecasted -> only the average marker is shown.
export const NoUserForecast: Story = {
  args: {
    forecasts: sampleForecasts,
    userForecast: null,
    average: average(sampleForecasts),
  },
};

// A tight consensus near the high end.
export const Consensus: Story = {
  args: {
    forecasts: [0.82, 0.85, 0.86, 0.88, 0.9, 0.91].map((forecast, i) =>
      makeForecast({ forecast, forecast_id: i + 1, user_id: i + 1 }),
    ),
    userForecast: 0.86,
    average: 0.87,
  },
};

// Too few forecasts for a KDE curve (needs at least two) -> bars only.
export const SingleForecast: Story = {
  args: {
    forecasts: [makeForecast({ forecast: 0.35 })],
    userForecast: 0.35,
    average: 0.35,
  },
};

// Empty state.
export const Empty: Story = {
  args: {
    forecasts: [],
    userForecast: null,
    average: null,
  },
};
