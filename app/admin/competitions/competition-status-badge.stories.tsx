import type { Meta, StoryObj } from "@storybook/react-vite";
import { CompetitionStatusBadge } from "./competition-status-badge";
import type { CompetitionStatus } from "@/lib/competition-status";

const STATUSES: CompetitionStatus[] = [
  "upcoming",
  "forecasts-open",
  "forecasts-closed",
  "ended",
  "private",
];

const meta = {
  title: "Competition/CompetitionStatusBadge",
  component: CompetitionStatusBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: STATUSES,
    },
  },
  args: {
    status: "forecasts-open",
  },
} satisfies Meta<typeof CompetitionStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Every lifecycle status side by side — used on both the admin competitions
// table and the public /competitions list.
export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {STATUSES.map((status) => (
        <CompetitionStatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};
