import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  CURRENT_USER_ID,
  choiceProp,
  closedProp,
  field,
  openProp,
  resolvedProp,
  untouchedProp,
} from "./fixtures";
import { PropSheet } from "./prop-sheet";

const shared = {
  currentUserId: CURRENT_USER_ID,
  forecasterCount: field.length,
  canEdit: false,
  canResolve: false,
  back: { href: "/competitions/6", label: "2026 Open" },
};

const meta = {
  title: "Prop/PropSheet",
  component: PropSheet,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof PropSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Still forecastable, with your mark set and the field around it. */
export const Open: Story = {
  args: { ...shared, prop: openProp, field, canForecast: true },
};

/** Nobody has forecasted yet, so the gauge is empty and the field is bare. */
export const Untouched: Story = {
  args: {
    ...shared,
    prop: untouchedProp,
    field: [],
    forecasterCount: 0,
    canForecast: true,
  },
};

/** Past the deadline, no result yet: the gauge is a record, not a control. */
export const Closed: Story = {
  args: { ...shared, prop: closedProp, field, canForecast: false },
};

/** Resolved: every mark grows a tail to the truth and prints its penalty. */
export const Resolved: Story = {
  args: { ...shared, prop: resolvedProp, field, canForecast: false },
};

/** A choice prop: the options table stands in for the field. */
export const Choice: Story = {
  args: { ...shared, prop: choiceProp, field: [], canForecast: true },
};

/** The admin's view of an open prop, with both dialogs reachable. */
export const AsAdmin: Story = {
  args: {
    ...shared,
    prop: openProp,
    field,
    canForecast: true,
    canEdit: true,
    canResolve: true,
  },
};
