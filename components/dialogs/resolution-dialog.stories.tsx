import type { Meta, StoryObj } from "@storybook/react-vite";

import type { PropOptionSummary, VProp } from "@/types/db_types";

import { ResolutionDialog } from "./resolution-dialog";

const prop = {
  prop_id: 41,
  prop_text: "Bitcoin closes the year above $150,000.",
  prop_notes: null,
  prop_kind: "binary",
  prop_user_id: null,
  category_id: 1,
  category_name: "Economics",
  competition_id: 6,
  competition_name: "2026 Open",
  resolution_id: null,
  resolution: null,
  resolution_notes: null,
  year: 2026,
} as unknown as VProp;

const options: PropOptionSummary[] = [
  "Claude",
  "GPT",
  "Gemini",
  "Something else",
].map((text, i) => ({
  option_id: i + 1,
  text,
  position: i + 1,
  outcome: null,
  user_forecast: null,
  community_average: null,
}));

const meta = {
  title: "Dialogs/ResolutionDialog",
  component: ResolutionDialog,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof ResolutionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A binary prop settles true, false, or not yet. */
export const Binary: Story = {
  args: { prop, isOpen: true, onClose: () => {} },
};

/** `one_of`: exactly one option won, so the outcomes are radios. */
export const OneOf: Story = {
  args: {
    prop: {
      ...prop,
      prop_kind: "one_of",
      prop_text: "Which model tops LMArena at the end of the year?",
      options,
    } as typeof prop & { options: PropOptionSummary[] },
    isOpen: true,
    onClose: () => {},
  },
};

/**
 * `any_of`: any number of options may have happened, so the outcomes are
 * checkboxes and resolving with none selected is a real answer.
 */
export const AnyOf: Story = {
  args: {
    prop: {
      ...prop,
      prop_kind: "any_of",
      prop_text: "Which of these ship before the end of the year?",
      options,
    } as typeof prop & { options: PropOptionSummary[] },
    isOpen: true,
    onClose: () => {},
  },
};
