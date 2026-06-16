import type { Meta, StoryObj } from "@storybook/react-vite";
import { UserRoleBadge, UserStatusBadge } from "./user-badges";

const meta = {
  title: "Admin/UserBadges",
  component: UserRoleBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    isAdmin: true,
  },
} satisfies Meta<typeof UserRoleBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The role pill: indigo Admin vs. neutral User. */
export const Role: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <UserRoleBadge isAdmin />
      <UserRoleBadge isAdmin={false} />
    </div>
  ),
};

/** The account-status pill: success-tinted Active vs. neutral Inactive. */
export const Status: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <UserStatusBadge active />
      <UserStatusBadge active={false} />
    </div>
  ),
};

/** Every admin user badge side by side. */
export const AllBadges: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <UserRoleBadge isAdmin />
      <UserRoleBadge isAdmin={false} />
      <UserStatusBadge active />
      <UserStatusBadge active={false} />
    </div>
  ),
};
