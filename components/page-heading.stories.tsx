import type { Meta, StoryObj } from "@storybook/react-vite";
import PageHeading from "./page-heading";
import { Button } from "./ui/button";

const meta = {
  title: "UI/PageHeading",
  component: PageHeading,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    title: { control: "text" },
    subtitle: { control: "text" },
    breadcrumbs: { control: false },
    children: { control: false },
  },
  args: {
    title: "Account Settings",
  },
} satisfies Meta<typeof PageHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {};

export const WithSubtitle: Story = {
  args: {
    subtitle: "Manage your profile and identity provider details.",
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    title: "User Management",
    breadcrumbs: { Admin: "/admin" },
  },
};

// `children` is the right-aligned action slot (e.g. a primary button).
export const WithAction: Story = {
  args: {
    title: "Competitions",
    breadcrumbs: { Admin: "/admin" },
    children: <Button size="sm">New competition</Button>,
  },
};

export const WithEverything: Story = {
  args: {
    title: "Competitions",
    subtitle: "Create competitions and review their props and resolutions.",
    breadcrumbs: { Admin: "/admin", Competitions: "/admin/competitions" },
    children: <Button size="sm">New competition</Button>,
  },
};

// The title is markdown-aware (links / bold / italic render).
export const MarkdownTitle: Story = {
  args: {
    title: "Results for **2026 Predictions**",
  },
};
