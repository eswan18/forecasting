import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./textarea";
import { Label } from "./label";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
    rows: { control: "number" },
  },
  args: {
    placeholder: "Enter text...",
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="w-[420px]">
        <Story />
      </div>
    ),
  ],
};

// The pattern used across the prop forms: a plain text label, an optional
// inline hint, and a character counter under the field.
export const WithLabelAndCounter: Story = {
  render: (args) => (
    <div className="grid w-[420px] gap-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        Proposition
        <span className="text-xs font-normal text-muted-foreground">
          (Markdown supported)
        </span>
      </Label>
      <Textarea
        {...args}
        className="min-h-24 resize-none"
        placeholder="e.g., Will the new product launch before March 2026?"
        defaultValue="Will global average temperature rise by more than 1.5°C this year?"
      />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Write a clear yes/no question.
        </p>
        <span className="text-xs text-muted-foreground">62/300</span>
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="grid w-[420px] gap-4">
      <div className="grid gap-1.5">
        <Label>Default</Label>
        <Textarea placeholder="Default textarea" className="resize-none" />
      </div>
      <div className="grid gap-1.5">
        <Label>With value</Label>
        <Textarea
          defaultValue="Some forecast notes go here."
          className="resize-none"
        />
      </div>
      <div className="grid gap-1.5">
        <Label>Disabled</Label>
        <Textarea placeholder="Disabled textarea" disabled className="resize-none" />
      </div>
    </div>
  ),
};
