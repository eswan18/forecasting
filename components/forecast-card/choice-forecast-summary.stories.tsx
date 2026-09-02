import type { Meta, StoryObj } from "@storybook/react-vite";

import { ChoiceForecastSummary } from "./choice-forecast-summary";
import {
  NBA_CHAMPION_OPTIONS,
  RESOLVED_ECONOMY_OPTIONS,
} from "./forecast-card.fixtures";

const meta = {
  title: "Forecast Card/ChoiceForecastSummary",
  component: ChoiceForecastSummary,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[520px] max-w-full">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    options: { control: false, description: "One row per option, in order" },
    showCommunityAvg: {
      control: "boolean",
      description: "Whether to show each option's community average",
    },
  },
  args: {
    showCommunityAvg: true,
  },
} satisfies Meta<typeof ChoiceForecastSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

// `one_of`, still open: the two options the user left blank read "—" with an
// empty bar.
export const PickOne: Story = {
  args: {
    kind: "one_of",
    options: NBA_CHAMPION_OPTIONS,
  },
};

// `any_of`, resolved: a check on the option that happened, a muted cross on
// the ones that didn't. The last row has no community average yet.
export const AnyThatApplyResolved: Story = {
  args: {
    kind: "any_of",
    options: RESOLVED_ECONOMY_OPTIONS,
  },
};

// Nobody forecasted any option and the prop is still open -> the whole list
// collapses to a placeholder.
export const NoForecast: Story = {
  args: {
    kind: "one_of",
    options: NBA_CHAMPION_OPTIONS.map((option) => ({
      ...option,
      user_forecast: null,
    })),
  },
};

// Resolved, but the user never forecast: the outcomes are the point of the
// card, so the rows stay — labels, marks and community averages, with no
// percentage column and no bars — under the "No forecast yet" line.
export const ResolvedNoForecast: Story = {
  args: {
    kind: "any_of",
    options: RESOLVED_ECONOMY_OPTIONS.map((option) => ({
      ...option,
      user_forecast: null,
    })),
  },
};
