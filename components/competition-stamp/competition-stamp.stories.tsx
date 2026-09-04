import type { Meta, StoryObj } from "@storybook/react-vite";

import { CompetitionStamp, type SeasonState } from "./competition-stamp";

const STATES: SeasonState[] = ["upcoming", "open", "scoring", "final"];

const meta = {
  title: "Competition/CompetitionStamp",
  component: CompetitionStamp,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: { state: { control: "select", options: STATES } },
  args: { state: "open" },
} satisfies Meta<typeof CompetitionStamp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * The whole scale. The two states that settle something are inked — red while
 * it is taking forecasts, ink once the result is history — and the two in
 * between are outlines. Both fills knock out in the stock, so they invert with
 * the edition rather than staying black.
 */
export const EveryState: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
      {STATES.map((state) => (
        <CompetitionStamp key={state} state={state} />
      ))}
    </div>
  ),
};
