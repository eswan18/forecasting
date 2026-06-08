import type { Meta, StoryObj } from "@storybook/react-vite";
import { ForecastCard } from "./forecast-card";
import { makeProp, PAST } from "./forecast-card.fixtures";

const meta = {
  title: "Forecast/ForecastCard",
  component: ForecastCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[640px] max-w-full">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    showCommunityAvg: {
      control: "boolean",
      description: "Whether to show the community-average comparison bar",
    },
    prop: {
      control: false,
      description: "The prop plus the user's forecast and community average",
    },
  },
  args: {
    showCommunityAvg: true,
  },
} satisfies Meta<typeof ForecastCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// The user has forecasted; community average shown for comparison.
export const Default: Story = {
  args: {
    prop: makeProp(),
    showCommunityAvg: true,
  },
};

// Same card with the community-average comparison hidden.
export const WithoutCommunityAverage: Story = {
  args: {
    prop: makeProp(),
    showCommunityAvg: false,
  },
};

// The user hasn't forecasted yet -> placeholder box, no comparison bar.
export const NoForecast: Story = {
  args: {
    prop: makeProp({ user_forecast: null, user_forecast_id: null }),
    showCommunityAvg: true,
  },
};

// Low probability -> red color scale.
export const LowProbability: Story = {
  args: {
    prop: makeProp({ user_forecast: 0.12, community_average: 0.25 }),
    showCommunityAvg: true,
  },
};

// High probability -> green color scale.
export const HighProbability: Story = {
  args: {
    prop: makeProp({ user_forecast: 0.91, community_average: 0.8 }),
    showCommunityAvg: true,
  },
};

// "you" and "avg" land on the same value -> combined "you / avg" label.
export const YouAndAvgIdentical: Story = {
  args: {
    prop: makeProp({ user_forecast: 0.6, community_average: 0.6 }),
    showCommunityAvg: true,
  },
};

// "you" and "avg" within ~12% -> collision-avoidance label offsetting.
export const YouAndAvgClose: Story = {
  args: {
    prop: makeProp({ user_forecast: 0.55, community_average: 0.5 }),
    showCommunityAvg: true,
  },
};

// Past the forecast deadline -> "Closed" status badge.
export const Closed: Story = {
  args: {
    prop: makeProp({ competition_forecasts_close_date: PAST }),
    showCommunityAvg: true,
  },
};

// Resolved yes -> "Yes" status badge.
export const ResolvedYes: Story = {
  args: {
    prop: makeProp({
      competition_forecasts_close_date: PAST,
      resolution: true,
      resolution_id: 5,
      user_forecast: 0.8,
      community_average: 0.74,
    }),
    showCommunityAvg: true,
  },
};

// No notes -> the notes line collapses to a blank spacer.
export const WithoutNotes: Story = {
  args: {
    prop: makeProp({ prop_notes: null }),
    showCommunityAvg: true,
  },
};

// Long prop text wraps; markdown is rendered.
export const LongPropText: Story = {
  args: {
    prop: makeProp({
      prop_text:
        "Will at least three of the five largest economies report **negative** quarterly GDP growth in the same quarter before the end of the year?",
      prop_notes:
        "Measured by nominal GDP; figures taken from each country's official statistics agency.",
    }),
    showCommunityAvg: true,
  },
};
