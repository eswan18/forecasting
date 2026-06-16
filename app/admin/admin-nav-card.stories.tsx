import type { Meta, StoryObj } from "@storybook/react-vite";
import { Flag, Users } from "lucide-react";
import { AdminNavCard } from "./admin-nav-card";

const meta = {
  title: "Admin/AdminNavCard",
  component: AdminNavCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    href: "/admin/users",
    title: "Users",
    description: "Browse accounts, manage access, and impersonate users.",
    icon: <Users size={18} />,
  },
} satisfies Meta<typeof AdminNavCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const FeatureFlags: Story = {
  args: {
    href: "/admin/feature-flags",
    title: "Feature Flags",
    description: "Toggle features globally or for individual users.",
    icon: <Flag size={18} />,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

/** How the cards tile on the admin landing index. */
export const Grid: Story = {
  render: () => (
    <div className="grid w-[40rem] grid-cols-2 gap-4">
      <AdminNavCard
        href="/admin/users"
        title="Users"
        description="Browse accounts, manage access, and impersonate users."
        icon={<Users size={18} />}
      />
      <AdminNavCard
        href="/admin/feature-flags"
        title="Feature Flags"
        description="Toggle features globally or for individual users."
        icon={<Flag size={18} />}
      />
    </div>
  ),
};
