import type { Meta, StoryObj } from "@storybook/react-vite";

import type { PropOptionSummary, VProp } from "@/types/db_types";

import { PropEditDialog } from "./prop-edit-dialog";

const prop = {
  prop_id: 41,
  prop_text: "I get an offer at Valimail.",
  prop_notes: "for any position",
  prop_kind: "binary",
  prop_user_id: null,
  category_id: 2,
  category_name: "Career",
  competition_id: 6,
  competition_name: "2026 Open",
  competition_forecasts_due_date: null,
  competition_forecasts_close_date: null,
  competition_end_date: null,
  prop_forecasts_due_date: null,
  prop_resolution_due_date: null,
  resolution_id: null,
  resolution: null,
  resolution_notes: null,
  year: 2026,
} as unknown as VProp;

const options: PropOptionSummary[] = [
  "Before June",
  "In the second half",
  "Not this year",
].map((text, i) => ({
  option_id: i + 1,
  text,
  position: i + 1,
  outcome: null,
  user_forecast: null,
  community_average: null,
}));

const meta = {
  title: "Dialogs/PropEditDialog",
  component: PropEditDialog,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof PropEditDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A binary prop: the claim and its notes, nothing else to name. */
export const Binary: Story = {
  args: { prop, isOpen: true, onClose: () => {} },
};

/**
 * A choice prop also edits what each option is called. The set itself is
 * frozen — forecasts hang off the option ids — so rows can only be renamed.
 */
export const WithOptions: Story = {
  args: {
    prop: { ...prop, prop_kind: "one_of", options } as typeof prop & {
      options: PropOptionSummary[];
    },
    isOpen: true,
    onClose: () => {},
  },
};
