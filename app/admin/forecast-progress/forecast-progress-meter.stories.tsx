import type { Meta, StoryObj } from "@storybook/react-vite";

import { sheetCss } from "@/components/prop-list/sheet";

import { ForecastProgressMeter, meterCss } from "./forecast-progress-meter";

/** The measure is scoped to the sheet, so the story prints the sheet too. */
const board = `
.hxp .board { display: grid; grid-template-columns: 5.5rem minmax(0, 1fr) 2.75rem; gap: 0 1.25rem; align-items: center; }
.hxp .board > * { display: contents; }
.hxp .board .r > * { padding: 0.5rem 0; border-bottom: 1px solid var(--rule); }
.hxp .board .who { font-size: 0.9375rem; }
.hxp .board .pc {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
`;

function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div className="hxp">
      <style
        dangerouslySetInnerHTML={{ __html: sheetCss + meterCss + board }}
      />
      <div className="col" style={{ paddingTop: "2.5rem" }}>
        <div style={{ maxWidth: "26rem" }}>{children}</div>
      </div>
    </div>
  );
}

const meta = {
  title: "Admin/ForecastProgressMeter",
  component: ForecastProgressMeter,
  parameters: {
    layout: "fullscreen",
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
      <Sheet>
        <Story />
      </Sheet>
    ),
  ],
} satisfies Meta<typeof ForecastProgressMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The mark lands on the goal line — the one stop printed heavier than the rest. */
export const Complete: Story = {
  args: { value: 1 },
};

/** Nothing forecast yet: the whole is still ruled, none of it inked. */
export const NotStarted: Story = {
  args: { value: 0 },
};

/** Counts that failed to load. No mark at zero — that would be a claim. */
export const NoData: Story = {
  args: { value: null },
};

/**
 * The reason the measure is not a bar: on one shared axis the end marks form a
 * column, and who is behind is legible without reading a figure.
 */
export const Field: Story = {
  render: () => (
    <div className="board">
      {[
        ["Lindsay", 0.12],
        ["Greg", 0.29],
        ["Akshay", 0.58],
        ["Carly", 0.83],
        ["Ethan", 1],
      ].map(([name, value]) => (
        <div className="r" key={name as string}>
          <span className="who">{name}</span>
          <ForecastProgressMeter value={value as number} />
          <span className="pc">{Math.round((value as number) * 100)}%</span>
        </div>
      ))}
    </div>
  ),
};
