import type { Meta, StoryObj } from "@storybook/react-vite";

import { sheetCss } from "@/components/prop-list/sheet";
import type { Competition } from "@/types/db_types";

import CompetitionRow from "./competition-row";
import { statusCss } from "./competition-status-badge";
import { rowCss } from "./row-css";

const competition = {
  id: 9,
  name: "Swan Family Pool",
  is_private: true,
  forecasts_open_date: null,
  forecasts_close_date: null,
  end_date: null,
  created_by_user_id: 1,
} as unknown as Competition;

const meta = {
  title: "Competition/AdminCompetitionRow",
  component: CompetitionRow,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  // The row hands its cells to the page's grid, so a story has to supply one
  // or every cell stacks.
  decorators: [
    (Story) => (
      <div className="hxp">
        <style
          dangerouslySetInnerHTML={{ __html: sheetCss + statusCss + rowCss }}
        />
        <div className="col">
          <div className="comps">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof CompetitionRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty, so its ⋯ menu offers a delete that will actually go through. */
export const Deletable: Story = {
  args: { competition, nProps: 0, nResolvedProps: 0 },
};

/**
 * With props, the delete is still offered — hiding it would leave an admin
 * wondering — but the confirmation explains why it cannot happen yet.
 */
export const HasProps: Story = {
  args: {
    competition: {
      ...competition,
      name: "2026 Open",
      is_private: false,
      // The status is derived from the dates, not from `is_private`, so a
      // public competition needs them or it reads as private anyway.
      forecasts_open_date: new Date("2026-01-01T12:00:00Z"),
      forecasts_close_date: new Date("2026-09-07T12:00:00Z"),
      end_date: new Date("2026-12-30T12:00:00Z"),
    },
    nProps: 37,
    nResolvedProps: 14,
  },
};
