import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  CalibrationSheet,
  type CalibrationForecast,
} from "./calibration-sheet";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 8, 2);

/**
 * A forecaster who is slightly overconfident at the top of the range: when
 * they say 90% it happens about 80% of the time.
 */
function record(): CalibrationForecast[] {
  const out: CalibrationForecast[] = [];
  const bands: [number, number, number][] = [
    // [predicted, how many, share that actually happened]
    [0.05, 14, 0.07],
    [0.15, 18, 0.11],
    [0.25, 22, 0.23],
    [0.35, 16, 0.38],
    [0.45, 12, 0.5],
    [0.55, 15, 0.53],
    [0.65, 19, 0.58],
    [0.75, 21, 0.67],
    [0.85, 17, 0.71],
    [0.95, 24, 0.79],
  ];
  let i = 0;
  for (const [p, n, hit] of bands) {
    for (let k = 0; k < n; k++, i++) {
      out.push({
        forecast: p,
        resolvedYes: k < Math.round(n * hit),
        createdAt: NOW - (i % 400) * DAY,
        competitionId: i % 3 === 0 ? 5 : 6,
        competitionName: i % 3 === 0 ? "2025 Open" : "2026 Open",
      });
    }
  }
  return out;
}

const meta = {
  title: "Calibration/CalibrationSheet",
  component: CalibrationSheet,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof CalibrationSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A full record, with the marks drifting below the line at the top end. */
export const Default: Story = { args: { forecasts: record() } };

/** A handful of forecasts: the marks are small and the bands are sparse. */
export const Sparse: Story = {
  args: { forecasts: record().slice(0, 9) },
};

/** Nothing has resolved yet. */
export const Empty: Story = { args: { forecasts: [] } };
