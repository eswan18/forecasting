import type { Meta, StoryObj } from "@storybook/react-vite";
import ResolvedPropCard from "./resolved-prop-card";

const RESOLUTION_DATE = new Date("2026-08-14T00:00:00Z");

const meta = {
  title: "Landing/ResolvedPropCard",
  component: ResolvedPropCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[380px] max-w-full">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    realized: { control: false },
    resolutionDate: { control: false },
  },
  args: {
    propId: 1,
    propNotes: null,
    forecast: null,
    resolution: null,
    realized: [],
    optionCount: 0,
    resolutionDate: RESOLUTION_DATE,
  },
} satisfies Meta<typeof ResolvedPropCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// A binary prop that happened: a success "Yes" pill and the user's probability.
export const BinaryYes: Story = {
  args: {
    propText: "Will the central bank cut rates before July?",
    propNotes: "Resolves on the published decision, not the minutes.",
    kind: "binary",
    forecast: 0.72,
    resolution: true,
  },
};

// The same card when the prop didn't happen — the pill flips to the muted
// destructive tokens.
export const BinaryNo: Story = {
  args: {
    propText: "Will annual inflation come in under 3%?",
    kind: "binary",
    forecast: 0.34,
    resolution: false,
  },
};

// `one_of`: exactly one option lands, and "You said" is the probability the
// user put on that winner.
export const PickOne: Story = {
  args: {
    propText: "Who wins the NBA championship?",
    propNotes: "Four options; the user gave the Thunder 45%.",
    kind: "one_of",
    realized: [{ text: "Oklahoma City Thunder", userForecast: 0.45 }],
    optionCount: 4,
  },
};

// `any_of` with several winners: only the first two labels fit, the rest
// collapse into "+n more".
export const AnyThatApply: Story = {
  args: {
    propText: "Which of these bills pass this session?",
    kind: "any_of",
    realized: [
      { text: "Housing supply act", userForecast: 0.6 },
      { text: "Permitting reform", userForecast: 0.31 },
      { text: "Farm bill renewal", userForecast: 0.55 },
    ],
    optionCount: 5,
  },
};

// `any_of` where nothing happened: a neutral "None" pill, and "0 of 5".
export const AnyThatApplyNone: Story = {
  args: {
    propText: "Which of these bills pass this session?",
    kind: "any_of",
    realized: [],
    optionCount: 5,
  },
};
