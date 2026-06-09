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

const longPropText = makeProp({
  user_forecast: 0.6,
  community_average: 0.48,
  prop_text:
    "Will at least three of the five largest economies by nominal GDP simultaneously report two consecutive quarters of negative real GDP growth at any point before the end of the calendar year, as measured by each country's official national statistics agency?",
});

const longNotes = makeProp({
  user_forecast: 0.6,
  community_average: 0.48,
  prop_notes:
    "Resolution uses the seasonally adjusted figures published by each country's primary national statistics office; preliminary estimates count, and later revisions will not change a resolution once it has been finalized by the competition admins.",
});

export const NeedleRight: Story = {
  render: () => (
    <div className="flex w-[660px] max-w-full flex-col gap-5">
      <EditableNeedleRight prop={withAvg} showCommunityAvg />
      <EditableNeedleRight prop={noForecast} showCommunityAvg />
    </div>
  ),
};

// Much longer prop text -> the title wraps; check the pencil + needle alignment.
export const LongPropText: Story = {
  render: () => (
    <div className="w-[660px] max-w-full">
      <EditableNeedleRight prop={longPropText} showCommunityAvg />
    </div>
  ),
};

// Much longer notes text -> the description line should wrap, not spill.
export const LongNotes: Story = {
  render: () => (
    <div className="w-[660px] max-w-full">
      <EditableNeedleRight prop={longNotes} showCommunityAvg />
    </div>
  ),
};
