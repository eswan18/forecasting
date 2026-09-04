import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Field } from "@/components/form-sheet/form-sheet";

import { OptionsEditor } from "./options-editor";

// The editor is controlled; stories hold the option list so typing and
// add/remove actually work in the canvas.
function StatefulOptionsEditor({
  value: initialValue,
  disabled,
  errors,
}: {
  value: string[];
  disabled?: boolean;
  errors?: string[];
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <OptionsEditor
      value={value}
      onChange={setValue}
      disabled={disabled}
      errors={errors}
    />
  );
}

const meta = {
  title: "Forms/OptionsEditor",
  component: StatefulOptionsEditor,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  // The editor is only ever rendered inside a form's Field, which is where its
  // styling comes from; a bare div would show it unstyled.
  decorators: [
    (Story) => (
      <div className="hxf" style={{ maxWidth: "28rem", padding: "1.5rem" }}>
        <Field label="Options" labelId="opts-story">
          <Story />
        </Field>
      </div>
    ),
  ],
  args: {
    value: ["", ""],
  },
} satisfies Meta<typeof StatefulOptionsEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// A fresh choice prop: the two blank rows the form starts with. Remove is
// disabled at the two-option minimum.
export const Empty: Story = {};

// A filled-in list; remove becomes available past the minimum.
export const Filled: Story = {
  args: {
    value: ["Boston Celtics", "Denver Nuggets", "Oklahoma City Thunder"],
  },
};

// Validation messages from `validateOptionLabels`.
export const WithErrors: Story = {
  args: {
    value: ["Boston Celtics", "", "Boston Celtics"],
    errors: ["Options cannot be blank", "Options must be unique"],
  },
};

// Read-only, e.g. while the form is submitting.
export const Disabled: Story = {
  args: {
    value: ["Boston Celtics", "Denver Nuggets", "Oklahoma City Thunder"],
    disabled: true,
  },
};
