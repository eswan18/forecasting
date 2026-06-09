import type { Meta, StoryObj } from "@storybook/react-vite";
import { EditableNeedleRight } from "./editable-needle-experiments";
import { makeProp } from "./forecast-card.fixtures";

// Throwaway gallery for the chosen editable needle direction (NeedleRight).
// Live (local state only) — type in the % box to see the needle update.
const meta = {
  title: "Forecast/Editable Needle Experiments",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const withAvg = makeProp({ user_forecast: 0.6, community_average: 0.48 });
const noForecast = makeProp({ user_forecast: null, user_forecast_id: null });

export const NeedleRight: Story = {
  render: () => (
    <div className="flex w-[660px] max-w-full flex-col gap-5">
      <EditableNeedleRight prop={withAvg} showCommunityAvg />
      <EditableNeedleRight prop={noForecast} showCommunityAvg />
    </div>
  ),
};
