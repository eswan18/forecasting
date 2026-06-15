import type { Meta, StoryObj } from "@storybook/react-vite";
import ForecastsList from "./forecasts-list";
import {
  sampleForecasts,
  CURRENT_USER_ID,
  makeForecast,
} from "./prop-views.fixtures";

const meta = {
  title: "Prop/ForecastsList",
  component: ForecastsList,
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
    currentUserId: { control: false },
  },
} satisfies Meta<typeof ForecastsList>;

export default meta;
type Story = StoryObj<typeof meta>;

// A full spread of forecasters; the current user's row is highlighted in indigo.
export const Default: Story = {
  args: {
    forecasts: sampleForecasts,
    currentUserId: CURRENT_USER_ID,
  },
};

// The viewer isn't among the forecasters -> no highlighted row.
export const NotAForecaster: Story = {
  args: {
    forecasts: sampleForecasts,
    currentUserId: 999,
  },
};

// A single forecast.
export const SingleForecast: Story = {
  args: {
    forecasts: [makeForecast({ user_name: "Solo", forecast: 0.42 })],
    currentUserId: 1,
  },
};

// Empty state.
export const Empty: Story = {
  args: {
    forecasts: [],
    currentUserId: 1,
  },
};
