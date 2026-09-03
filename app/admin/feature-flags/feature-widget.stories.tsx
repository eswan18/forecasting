import type { Meta, StoryObj } from "@storybook/react-vite";

import type { VFeatureFlag } from "@/types/db_types";

import { FeatureFlagsSheet } from "./feature-widget";

const flag = (
  id: number,
  name: string,
  enabled: boolean,
  userId: number | null = null,
  userName: string | null = null,
): VFeatureFlag =>
  ({
    id,
    name,
    enabled,
    user_id: userId,
    user_name: userName,
    user_email: userName ? `${userName.split(" ")[0]}@example.com` : null,
  }) as VFeatureFlag;

const meta = {
  title: "Admin/FeatureFlags",
  component: FeatureFlagsSheet,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof FeatureFlagsSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A default that is on, one that is off, and one nobody has set. */
export const Default: Story = {
  args: {
    flags: [
      flag(1, "personal-props", true),
      flag(2, "personal-props", false, 3, "Ethan Swan"),
      flag(3, "choice-props", false),
      flag(4, "calibration-page", true, 7, "Greg Moore"),
    ],
  },
};

/** The state the live page is in: one feature, no default row, one override. */
export const UnsetDefault: Story = {
  args: {
    flags: [flag(2, "personal-props", false, 3, "Ethan Swan")],
  },
};

export const Empty: Story = { args: { flags: [] } };

export const Failed: Story = {
  args: { flags: [], error: "Could not read the feature flags." },
};
