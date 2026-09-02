import type { Meta, StoryObj } from "@storybook/react-vite";
import type { PropOptionSummary } from "@/types/db_types";
import PropOptionsTable from "./prop-options-table";

// A `one_of` prop mid-flight: probabilities sum to 100% and nothing has an
// outcome yet. The third option is one the reader left blank.
const CHAMPION_OPTIONS: PropOptionSummary[] = [
  {
    option_id: 1,
    text: "Boston Celtics",
    position: 0,
    outcome: null,
    user_forecast: 0.35,
    community_average: 0.32,
  },
  {
    option_id: 2,
    text: "Denver Nuggets",
    position: 1,
    outcome: null,
    user_forecast: 0.25,
    community_average: 0.27,
  },
  {
    option_id: 3,
    text: "Oklahoma City Thunder",
    position: 2,
    outcome: null,
    user_forecast: null,
    community_average: 0.19,
  },
  {
    option_id: 4,
    text: "Any other team",
    position: 3,
    outcome: null,
    user_forecast: 0.4,
    community_average: 0.22,
  },
];

// An `any_of` prop after resolution: independent options, two of which landed.
const RESOLVED_LAYOFF_OPTIONS: PropOptionSummary[] = [
  {
    option_id: 11,
    text: "Northwind Logistics",
    position: 0,
    outcome: true,
    user_forecast: 0.62,
    community_average: 0.58,
  },
  {
    option_id: 12,
    text: "Vantage Semiconductor",
    position: 1,
    outcome: false,
    user_forecast: 0.28,
    community_average: 0.31,
  },
  {
    option_id: 13,
    text: "Harbor Foods",
    position: 2,
    outcome: true,
    user_forecast: 0.44,
    community_average: 0.5,
  },
  {
    option_id: 14,
    text: "Copperline Energy",
    position: 3,
    outcome: false,
    user_forecast: 0.51,
    community_average: null,
  },
];

const meta = {
  title: "Prop/PropOptionsTable",
  component: PropOptionsTable,
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
    options: { control: false, description: "One row per option, in order" },
    resolved: { control: "boolean" },
  },
} satisfies Meta<typeof PropOptionsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// Open `one_of` prop: no Outcome column, and the option the reader skipped
// reads as a muted dash.
export const PickOne: Story = {
  args: {
    kind: "one_of",
    options: CHAMPION_OPTIONS,
    resolved: false,
  },
};

// Resolved `any_of` prop: the Outcome column appears, with a success check on
// the options that happened and a muted cross on the rest.
export const AnyThatApplyResolved: Story = {
  args: {
    kind: "any_of",
    options: RESOLVED_LAYOFF_OPTIONS,
    resolved: true,
  },
};
