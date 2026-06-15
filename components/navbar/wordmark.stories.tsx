import type { Meta, StoryObj } from "@storybook/react-vite";
import { Wordmark } from "./wordmark";

const meta = {
  title: "Navbar/Wordmark",
  component: Wordmark,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Wordmark>;

export default meta;
type Story = StoryObj<typeof meta>;

// The brand mark as it appears in the navbar. Toggle the Storybook theme to
// check the dark variant — the glyph is token-colored.
export const Default: Story = {};

// Sanity-check contrast on a muted surface (e.g. inside a hovered nav link).
export const OnMutedSurface: Story = {
  render: () => (
    <div className="inline-flex rounded-md bg-muted px-2 py-1.5">
      <Wordmark />
    </div>
  ),
};
