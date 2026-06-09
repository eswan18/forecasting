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
    forecast: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
      description: "The user's forecast (0–1), drawn in the primary color",
    },
    baseline: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
      description: "Optional baseline, e.g. community average (0–1), drawn muted",
    },
    forecastLabel: {
      control: "text",
      description: 'Tooltip label for the forecast (default "You")',
    },
    baselineLabel: {
      control: "text",
      description: 'Tooltip label for the baseline (default "Avg")',
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    showAxisLabels: {
      control: "boolean",
    },
  },
  args: {
    forecast: 0.72,
    size: "md",
    showAxisLabels: true,
  },
} satisfies Meta<typeof ForecastNeedle>;

export default meta;
type Story = StoryObj<typeof meta>;

// (a) The user's forecast on its own.
export const UserForecast: Story = {
  args: {
    forecast: 0.72,
  },
};

// (b) The user's forecast plus a muted baseline (e.g. the community average).
export const WithBaseline: Story = {
  args: {
    forecast: 0.72,
    baseline: 0.55,
  },
};

// Sanity check across the arc: low / mid / high.
export const LowMidHigh: Story = {
  render: (args) => (
    <div className="flex items-end gap-8">
      <ForecastNeedle {...args} forecast={0.15} />
      <ForecastNeedle {...args} forecast={0.5} />
      <ForecastNeedle {...args} forecast={0.85} />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-8">
      <ForecastNeedle {...args} size="sm" />
      <ForecastNeedle {...args} size="md" />
      <ForecastNeedle {...args} size="lg" />
    </div>
  ),
};

export const CustomLabels: Story = {
  args: {
    forecast: 0.66,
    baseline: 0.4,
    forecastLabel: "Me",
    baselineLabel: "Community",
  },
};

export const NoAxisLabels: Story = {
  args: {
    forecast: 0.68,
    baseline: 0.5,
    showAxisLabels: false,
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
        <ForecastNeedle {...args} forecast={0.72} baseline={0.58} />
      </div>
    </div>
  ),
};
