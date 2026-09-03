import type { Meta, StoryObj } from "@storybook/react-vite";

import { sheetCss } from "@/components/prop-list/sheet";
import type { CompetitionStatus } from "@/lib/competition-status";

import { CompetitionStatusBadge, statusCss } from "./competition-status-badge";

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
  // The marker takes its ink from the sheet it is printed on.
  decorators: [
    (Story) => (
      <div className="hxp">
        <style dangerouslySetInnerHTML={{ __html: sheetCss + statusCss }} />
        <div className="col" style={{ paddingTop: "1.5rem" }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof CompetitionStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Every lifecycle status side by side, as the admin competitions table sets
// them: only the competition still taking forecasts prints in ink.
export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
      {STATUSES.map((status) => (
        <CompetitionStatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};
