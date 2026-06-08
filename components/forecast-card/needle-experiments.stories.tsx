import type { Meta, StoryObj } from "@storybook/react-vite";
import { ForecastCardNeedleRight } from "./needle-experiments";
import { makeProp } from "./forecast-card.fixtures";

// Throwaway gallery for the chosen needle-in-card direction (NeedleRight).
const meta = {
  title: "Forecast/Needle Experiments",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const withAvg = makeProp({ user_forecast: 0.72, community_average: 0.58 });
const noAvg = makeProp({ user_forecast: 0.64, community_average: null });
const low = makeProp({ user_forecast: 0.14, community_average: 0.3 });
const high = makeProp({ user_forecast: 0.9, community_average: 0.78 });
const noForecast = makeProp({ user_forecast: null, user_forecast_id: null });

export const NeedleRight: Story = {
  render: () => (
    <div className="flex w-[640px] max-w-full flex-col gap-5">
      <ForecastCardNeedleRight prop={withAvg} showCommunityAvg />
      <ForecastCardNeedleRight prop={noAvg} showCommunityAvg={false} />
      <ForecastCardNeedleRight prop={low} showCommunityAvg />
      <ForecastCardNeedleRight prop={high} showCommunityAvg />
      <ForecastCardNeedleRight prop={noForecast} showCommunityAvg />
    </div>
  ),
};
