import type { Meta, StoryObj } from "@storybook/react-vite";

import { InviteMemberDialog } from "./invite-member-dialog";

const meta = {
  title: "Competition/InviteMemberDialog",
  component: InviteMemberDialog,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof InviteMemberDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The picker reads its eligible users from the server, which Storybook mocks
 * as empty — so the list says so. What this story is for is the frame: the
 * field on its rule, the role choice, and the two controls in the footer.
 */
export const Open: Story = {
  args: {
    competitionId: 9,
    isOpen: true,
    onClose: () => {},
    onMemberChange: () => {},
  },
};
