import type { Meta, StoryObj } from "@storybook/react-vite";
import { EditableForecastCard } from "./editable-forecast-card";
import { makeProp } from "./forecast-card.fixtures";

// Note: in Storybook there's no logged-in user (the /api/me fetch returns
// null), so the admin "edit prop" pencil is hidden. The Save / Cancel buttons
// only appear after you drag the slider or type a new value (i.e. once the
// local forecast differs from the saved one). Saving is mocked — see
// .storybook/mocks/db_actions.ts.
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

// The user already has a forecast: probability box, filled slider, and handle.
export const Default: Story = {
  args: {
    prop: makeProp({ user_forecast: 0.6, user_forecast_id: 10 }),
  },
};

// No forecast yet: "—" box and a "Click to set forecast" slider hint.
export const NoForecast: Story = {
  args: {
    prop: makeProp({ user_forecast: null, user_forecast_id: null }),
  },
};

// Low probability -> red color scale on the box, bar, and handle.
export const LowProbability: Story = {
  args: {
    prop: makeProp({ user_forecast: 0.12, user_forecast_id: 10 }),
  },
};

// High probability -> green color scale.
export const HighProbability: Story = {
  args: {
    prop: makeProp({ user_forecast: 0.91, user_forecast_id: 10 }),
  },
};

// Long prop text wraps; markdown is rendered.
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
