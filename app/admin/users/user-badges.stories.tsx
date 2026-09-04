import type { Meta, StoryObj } from "@storybook/react-vite";

import { sheetCss } from "@/components/prop-list/sheet";

import { UserAccessMark, UserRoleMark, userMarksCss } from "./user-badges";

/** The stock the marks are printed on, so they are seen in their own ink. */
function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div className="hxp">
      <style dangerouslySetInnerHTML={{ __html: sheetCss + userMarksCss }} />
      <div className="col" style={{ paddingTop: "2.5rem" }}>
        {children}
      </div>
    </div>
  );
}

const meta = {
  title: "Admin/UserMarks",
  component: UserRoleMark,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { isAdmin: true },
  decorators: [
    (Story) => (
      <Sheet>
        <Story />
      </Sheet>
    ),
  ],
} satisfies Meta<typeof UserRoleMark>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An admin prints; a plain account prints nothing at all. */
export const Role: Story = {
  render: () => (
    <>
      <UserRoleMark isAdmin />
      <UserRoleMark isAdmin={false} />
    </>
  ),
};

/** A closed account prints; a live one prints nothing at all. */
export const Access: Story = {
  render: () => (
    <>
      <UserAccessMark active={false} />
      <UserAccessMark active />
    </>
  ),
};

/** Both marks on one account: an admin whose login has been closed. */
export const Both: Story = {
  render: () => (
    <>
      <UserRoleMark isAdmin />
      <UserAccessMark active={false} />
    </>
  ),
};
