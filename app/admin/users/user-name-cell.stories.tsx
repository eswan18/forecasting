import type { CSSProperties } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { sheetCss } from "@/components/prop-list/sheet";
import type { VUser } from "@/types/db_types";

import { ledgerCss } from "./ledger-css";
import { UserNameCell } from "./user-name-cell";

/**
 * A stand-in portrait, inlined so the story has a photograph to set without
 * reaching off the machine for one.
 */
const PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56">' +
      '<rect width="56" height="56" fill="#e8503a"/>' +
      '<circle cx="28" cy="21" r="9" fill="#ffffff"/>' +
      '<path d="M8 56c0-11 9-19 20-19s20 8 20 19z" fill="#ffffff"/>' +
      "</svg>",
  );

const user = {
  id: 4,
  name: "Ethan Swan",
  email: "ethan@example.com",
  is_admin: false,
  deactivated_at: null,
  idp_user_id: null,
  username: "eswan18",
  picture_url: PHOTO,
  created_at: new Date("2026-01-04T00:00:00Z"),
  updated_at: new Date("2026-01-04T00:00:00Z"),
} satisfies VUser;

/**
 * One entry of the directory.
 *
 * The component is only set correctly inside one — the gutter its photo hangs
 * in is declared on the entry, and the entry's own class is what pales a closed
 * account — so every story draws the entry rather than its contents alone.
 */
function Row({
  user: u,
  mark,
  showAdminMark,
}: {
  user: VUser;
  mark?: "off" | "mine";
  showAdminMark?: boolean;
}) {
  return (
    <div className={mark ? `acct ${mark}` : "acct"}>
      <UserNameCell
        user={u}
        isViewer={mark === "mine"}
        showAdminMark={showAdminMark}
      />
    </div>
  );
}

const meta = {
  title: "Admin/UserNameCell",
  component: UserNameCell,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { user },
  decorators: [
    (Story) => (
      <div className="hxp">
        <style
          dangerouslySetInnerHTML={{
            __html: sheetCss + ledgerCss,
          }}
        />
        <div className="col" style={{ paddingTop: "2.5rem" }}>
          <div className="dir" style={{ "--rows": 4 } as CSSProperties}>
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof UserNameCell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What the IdP has a picture for. */
export const WithPhoto: Story = {
  render: (args) => <Row user={args.user} />,
};

/**
 * And what it does not: blank paper, not a disc with an initial in it. The
 * gutter stays open regardless, which is what keeps the names flush.
 */
export const WithoutPhoto: Story = {
  args: { user: { ...user, name: "Jane Doe", picture_url: null } },
  render: (args) => <Row user={args.user} />,
};

/**
 * A closed account. The entry pales, and the photo — already down to one ink —
 * goes further off the plate.
 */
export const Deactivated: Story = {
  args: { user: { ...user, deactivated_at: new Date("2026-06-01T00:00:00Z") } },
  render: (args) => <Row user={args.user} mark="off" />,
};

/**
 * A closed admin, which is the one entry that still prints a mark: it files
 * under Deactivated, so nothing else on the page would say that activating it
 * hands back the run of the site.
 */
export const DeactivatedAdmin: Story = {
  args: {
    user: {
      ...user,
      name: "Maggie Chen",
      is_admin: true,
      picture_url: null,
      deactivated_at: new Date("2026-06-01T00:00:00Z"),
    },
  },
  render: (args) => <Row user={args.user} mark="off" showAdminMark />,
};

/** The reader's own row, in the ink that means "you" everywhere else. */
export const Mine: Story = {
  render: (args) => <Row user={args.user} mark="mine" />,
};

/**
 * Four at once, in the two columns the directory sets them in. This is the only
 * way the gutter can be read: the accounts with no picture have to land on the
 * same left edge as the ones that have one.
 */
export const Ledger: Story = {
  render: () => (
    <>
      <Row user={user} mark="mine" />
      <Row user={{ ...user, id: 5, name: "Jane Doe", picture_url: null }} />
      <Row
        user={{
          ...user,
          id: 6,
          name: "Sam Reed",
          email: "sam@example.com",
          is_admin: true,
        }}
      />
      <Row
        user={{
          ...user,
          id: 7,
          name: "Alex Fen",
          email: "alex@example.com",
          deactivated_at: new Date("2026-06-01T00:00:00Z"),
        }}
        mark="off"
      />
    </>
  ),
};
