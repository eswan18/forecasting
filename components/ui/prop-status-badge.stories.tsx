import type { Meta, StoryObj } from "@storybook/react-vite";
import { PropStatusBadge } from "./prop-status-badge";

const meta = {
  title: "UI/PropStatusBadge",
  component: PropStatusBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["open", "closed", "resolved-yes", "resolved-no"],
      description: "The lifecycle status of the prop",
    },
    label: {
      control: "text",
      description: "Custom label (defaults to status name)",
    },
  },
} satisfies Meta<typeof PropStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Individual status stories
export const Open: Story = {
  args: {
    status: "open",
  },
};

export const Closed: Story = {
  args: {
    status: "closed",
  },
};

export const ResolvedYes: Story = {
  args: {
    status: "resolved-yes",
  },
};

export const ResolvedNo: Story = {
  args: {
    status: "resolved-no",
  },
};

// All states comparison
export const AllStates: Story = {
  args: {
    status: "open",
  },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <PropStatusBadge status="open" />
      <PropStatusBadge status="closed" />
      <PropStatusBadge status="resolved-yes" />
      <PropStatusBadge status="resolved-no" />
    </div>
  ),
};

// In context - showing how it might appear in a card
export const InContext: Story = {
  args: {
    status: "open",
  },
  render: () => (
    <div className="bg-card rounded-lg border border-border p-4 w-80">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs text-muted-foreground">Category</span>
        <PropStatusBadge status="open" />
      </div>
      <h3 className="font-medium text-foreground">
        Will the temperature exceed 30°C tomorrow?
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        Based on local weather station data
      </p>
    </div>
  ),
};

// Resolved in context
export const ResolvedInContext: Story = {
  args: {
    status: "resolved-yes",
  },
  render: () => (
    <div className="bg-card rounded-lg border border-border p-4 w-80">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs text-muted-foreground">Category</span>
        <PropStatusBadge status="resolved-yes" />
      </div>
      <h3 className="font-medium text-foreground">
        Will the temperature exceed 30°C tomorrow?
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        Based on local weather station data
      </p>
    </div>
  ),
};
