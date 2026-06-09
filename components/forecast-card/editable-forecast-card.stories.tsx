import type { Meta, StoryObj } from "@storybook/react-vite";
import { EditableForecastCard } from "./editable-forecast-card";
import { makeProp } from "./forecast-card.fixtures";

// Note: in Storybook there's no logged-in user (the /api/me fetch returns
// null), so the admin "edit prop" pencil is hidden. The Save / Cancel buttons
// only appear once you change the forecast (type a new value in the % box).
// Saving is mocked — see .storybook/mocks/db_actions.ts.
const meta = {
  title: "Forecast/EditableForecastCard",
  component: EditableForecastCard,
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
    prop: {
      control: false,
      description: "The prop plus the user's forecast and community average",
    },
    onForecastUpdate: {
      control: false,
      description: "Called after a forecast is created or updated",
    },
  },
} satisfies Meta<typeof EditableForecastCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Has a forecast: needle (with community-average ghost) and the editable % box.
export const Default: Story = {
  args: {
    prop: makeProp({ user_forecast: 0.6, user_forecast_id: 10 }),
  },
};

// No forecast yet: placeholder + empty % box; type a value to set it.
export const NoForecast: Story = {
  args: {
    prop: makeProp({ user_forecast: null, user_forecast_id: null }),
  },
};

// Low probability -> needle points left, into the red.
export const LowProbability: Story = {
  args: {
    prop: makeProp({ user_forecast: 0.12, user_forecast_id: 10 }),
  },
};

// High probability -> needle points right, into the green.
export const HighProbability: Story = {
  args: {
    prop: makeProp({ user_forecast: 0.91, user_forecast_id: 10 }),
  },
};

// Long prop text wraps; the edit pencil stays beside it.
export const LongPropText: Story = {
  args: {
    prop: makeProp({
      user_forecast: 0.45,
      user_forecast_id: 10,
      prop_text:
        "Will at least three of the five largest economies report **negative** quarterly GDP growth in the same quarter before the end of the year?",
      prop_notes:
        "Measured by nominal GDP; figures from each country's official statistics agency.",
    }),
  },
};

// Long notes wrap rather than spilling off the side.
export const LongNotes: Story = {
  args: {
    prop: makeProp({
      user_forecast: 0.6,
      user_forecast_id: 10,
      prop_notes:
        "Resolution uses the seasonally adjusted figures published by each country's primary national statistics office; preliminary estimates count, and later revisions will not change a resolution once it has been finalized by the competition admins.",
    }),
  },
};
