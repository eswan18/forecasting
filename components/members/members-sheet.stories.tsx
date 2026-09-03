import type { Meta, StoryObj } from "@storybook/react-vite";
import Link from "next/link";

import { sheetCss } from "@/components/prop-list/sheet";
import type { VCompetitionMember } from "@/types/db_types";

import { MembersSheet, membersCss } from "./members-sheet";

const CURRENT_USER_ID = 3;

const member = (
  id: number,
  name: string,
  email: string,
  role: "admin" | "forecaster",
): VCompetitionMember => ({
  membership_id: id * 10,
  competition_id: 9,
  user_id: id,
  role,
  membership_created_at: new Date(Date.UTC(2026, 1, 4)),
  membership_updated_at: new Date(Date.UTC(2026, 1, 4)),
  competition_name: "Swan Family Pool",
  competition_is_private: true,
  user_name: name,
  user_email: email,
  user_username: null,
  user_picture_url: null,
});

const members: VCompetitionMember[] = [
  member(1, "Akshay Rangesh", "akshay@example.com", "admin"),
  member(2, "Carly Fiorina", "carly.fiorina@example.com", "admin"),
  member(3, "Ethan Swan", "ethanpswan@example.com", "forecaster"),
  member(4, "Greg Moore", "greg.moore@example.com", "forecaster"),
  member(5, "Lindsay Muth", "lindsay@example.com", "forecaster"),
  member(6, "T. Mbeki", "t.mbeki.with.a.rather.long@example.com", "forecaster"),
];

/** The sheet's own frame, so the roster is seen in the page it lives on. */
function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div className="hxp">
      <style dangerouslySetInnerHTML={{ __html: sheetCss + membersCss }} />
      <div className="col">
        {/* the panel's own head, copied so the story shows the page as shipped */}
        <header className="masthead">
          <h1>Swan Family Pool</h1>
        </header>
        <h2 className="kicker">
          <span>
            Members<span className="aside num"> · {members.length}</span>
          </span>
          <Link className="aside" href="/competitions/9">
            ← Overview
          </Link>
        </h2>
        <div className="rosterhead">
          <span>Forecaster</span>
          <span className="add">+ Add member</span>
        </div>
        {children}
      </div>
    </div>
  );
}

const meta = {
  title: "Competition/MembersSheet",
  component: MembersSheet,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <Sheet>
        <Story />
      </Sheet>
    ),
  ],
} satisfies Meta<typeof MembersSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

const shared = { competitionId: 9, currentUserId: CURRENT_USER_ID, members };

/** A forecaster's view: the roster, no row menus. */
export const Default: Story = { args: { ...shared, canManage: false } };

/** A competition admin can promote, demote and remove. */
export const AsAdmin: Story = { args: { ...shared, canManage: true } };

/** With one admin left, the menu refuses to demote or remove them. */
export const LastAdmin: Story = {
  args: {
    ...shared,
    canManage: true,
    members: members.map((m, i) =>
      i === 1 ? { ...m, role: "forecaster" as const } : m,
    ),
  },
};

export const Empty: Story = {
  args: { ...shared, members: [], canManage: true },
};
