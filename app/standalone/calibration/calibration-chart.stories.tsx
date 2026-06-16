import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalibrationChart } from "./calibration-chart";
import type { CalibrationBucket } from "@/lib/calibration";

function bucket(
  i: number,
  count: number,
  observedFrequency: number,
): CalibrationBucket {
  return {
    binStart: i / 10,
    binEnd: (i + 1) / 10,
    count,
    meanPredicted: (i + 0.5) / 10,
    observedFrequency,
  };
}

// Observed ≈ predicted — points hug the diagonal.
const WELL_CALIBRATED: CalibrationBucket[] = [
  bucket(0, 12, 0.04),
  bucket(2, 18, 0.27),
  bucket(4, 22, 0.48),
  bucket(6, 16, 0.63),
  bucket(8, 14, 0.82),
  bucket(9, 9, 0.96),
];

// Confident predictions that don't pan out — points fall below the diagonal at
// the high end and above it at the low end.
const OVERCONFIDENT: CalibrationBucket[] = [
  bucket(0, 10, 0.18),
  bucket(1, 14, 0.26),
  bucket(7, 15, 0.52),
  bucket(8, 20, 0.55),
  bucket(9, 24, 0.6),
];

const meta = {
  title: "Calibration/CalibrationChart",
  component: CalibrationChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[28rem] rounded-lg border bg-card p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CalibrationChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WellCalibrated: Story = {
  args: { buckets: WELL_CALIBRATED },
};

export const Overconfident: Story = {
  args: { buckets: OVERCONFIDENT },
};

export const Sparse: Story = {
  args: { buckets: [bucket(3, 2, 0.5), bucket(7, 1, 1)] },
};

export const Empty: Story = {
  args: { buckets: [] },
};
