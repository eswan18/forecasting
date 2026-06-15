import type { Meta, StoryObj } from "@storybook/react-vite";
import { ForecastScoresTable } from "./forecast-scores-table";
import {
  categories,
  sortedCategoryEntries,
  sortedCategoryScores,
  sortedForecasts,
} from "./forecast-scores-table.fixtures";

const meta = {
  title: "Competition/ForecastScoresTable",
  component: ForecastScoresTable,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    sortedCategoryEntries: { control: false },
    sortedCategoryScores: { control: false },
    sortedForecasts: { control: false },
    categories: { control: false },
  },
  args: {
    sortedCategoryEntries,
    sortedCategoryScores,
    sortedForecasts,
    categories,
  },
} satisfies Meta<typeof ForecastScoresTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// Grouped by category (the default). Each category band shows its aggregate
// penalty; rows are sorted worst-penalty-first. Flip the switch to see the
// flat, penalty-ranked view.
export const Default: Story = {};
