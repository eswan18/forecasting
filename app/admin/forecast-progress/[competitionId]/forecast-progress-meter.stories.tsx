import type { Meta, StoryObj } from "@storybook/react-vite";
import { ForecastProgressMeter } from "./forecast-progress-meter";

const meta = {
  title: "Admin/ForecastProgressMeter",
  component: ForecastProgressMeter,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
  },
  args: {
    value: 0.6,
  },
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ForecastProgressMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Complete: Story = {
  args: { value: 1 },
};

export const NotStarted: Story = {
  args: { value: 0 },
};

/** The full range of fills, from not-started through complete. */
export const Steps: Story = {
  render: () => (
    <div className="flex w-48 flex-col gap-3">
      {[0, 0.25, 0.5, 0.8, 1].map((v) => (
        <ForecastProgressMeter key={v} value={v} />
      ))}
    </div>
  ),
};
