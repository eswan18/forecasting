import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoadingSheet } from "./loading-sheet";
import { StopSheet } from "./stop-sheet";

const meta = {
  title: "Chrome/StopSheet",
  component: StopSheet,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof StopSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A URL that names nothing. */
export const NotFound: Story = {
  args: {
    code: "404",
    title: "Page not found",
    message:
      "We couldn't find the page you were looking for. It may have been resolved, renamed, or never existed.",
  },
};

/** A page that could not be built — the message is the caller's own. */
export const Failed: Story = {
  args: { code: "Error", title: "Prop not found" },
};

/** The route boundary, which can offer a retry as well as a way out. */
export const Boundary: Story = {
  args: {
    code: "Error",
    title: "Something went wrong",
    message: "This page didn't load. The failure has been reported.",
    detail: "Reference 3f81c0a94",
    actions: [
      { label: "Try again", onClick: () => {}, primary: true },
      { label: "Return home", href: "/" },
    ],
  },
};

/** Somewhere the reader is not allowed. */
export const Locked: Story = {
  args: {
    code: "Locked",
    title: "Private competition",
    message: "You are not a member of this competition.",
  },
};

/** The sheet before its content lands: the frame is known, the copy is not. */
export const Loading: StoryObj<typeof LoadingSheet> = {
  render: (args) => <LoadingSheet {...args} />,
  args: { rows: 6 },
};
