import type { Meta, StoryObj } from "@storybook/react-vite";
import { ForecastNeedle } from "./forecast-needle";

const meta = {
  title: "UI/ForecastNeedle",
  component: ForecastNeedle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Overall width of the gauge",
    },
    showAxisLabels: {
      control: "boolean",
      description: "Show the 0% / 50% / 100% axis labels",
    },
    needles: {
      control: "object",
      description:
        "One or more needles. Each has { value (0–1), color?, label? }.",
    },
  },
  args: {
    size: "md",
    showAxisLabels: true,
    needles: [{ value: 0.6 }],
  },
} satisfies Meta<typeof ForecastNeedle>;

export default meta;
type Story = StoryObj<typeof meta>;

// (a) Just a user's forecast.
export const SingleForecast: Story = {
  args: {
    needles: [{ value: 0.72 }],
  },
};

// (b) A user's forecast plus a baseline (e.g. the community average).
export const ForecastWithBaseline: Story = {
  args: {
    needles: [
      { value: 0.72, color: "var(--primary)", label: "You" },
      { value: 0.55, color: "var(--color-muted-foreground)", label: "Avg" },
    ],
  },
};

// Sanity check across the arc: low / mid / high.
export const LowMidHigh: Story = {
  render: (args) => (
    <div className="flex items-end gap-8">
      <ForecastNeedle {...args} needles={[{ value: 0.15 }]} />
      <ForecastNeedle {...args} needles={[{ value: 0.5 }]} />
      <ForecastNeedle {...args} needles={[{ value: 0.85 }]} />
    </div>
  ),
};

// The color prop accepts any CSS color string.
export const CustomColors: Story = {
  args: {
    needles: [
      { value: 0.8, color: "var(--chart-1)", label: "Chart 1" },
      { value: 0.45, color: "var(--color-red-500)", label: "Red 500" },
      { value: 0.2, color: "#7c3aed", label: "Hex" },
    ],
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-8">
      <ForecastNeedle {...args} size="sm" needles={[{ value: 0.6 }]} />
      <ForecastNeedle {...args} size="md" needles={[{ value: 0.6 }]} />
      <ForecastNeedle {...args} size="lg" needles={[{ value: 0.6 }]} />
    </div>
  ),
};

export const NoAxisLabels: Story = {
  args: {
    showAxisLabels: false,
    needles: [{ value: 0.68, label: "You" }],
  },
};

// Approximates how it might look inside a forecast card.
export const InContext: Story = {
  render: (args) => (
    <div className="w-80 rounded-lg border border-border bg-card p-5">
      <div className="mb-2 text-xs text-muted-foreground">Geopolitics</div>
      <h3 className="mb-4 font-medium text-foreground">
        Will the temperature exceed 30°C tomorrow?
      </h3>
      <div className="flex justify-center">
        <ForecastNeedle
          {...args}
          needles={[
            { value: 0.72, color: "var(--primary)", label: "You" },
            { value: 0.58, color: "var(--color-muted-foreground)", label: "Avg" },
          ]}
        />
      </div>
    </div>
  ),
};
