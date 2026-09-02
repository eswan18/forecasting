import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { valuesFromOptions } from "./choice-entry";
import { ChoiceForecastEditor } from "./choice-forecast-editor";
import {
  ECONOMY_OPTIONS,
  NBA_CHAMPION_OPTIONS,
} from "./forecast-card.fixtures";

// The editor is controlled, so the stories hold the values and feed changes
// back in — typing in a % box updates the row and the running total.
function StatefulChoiceForecastEditor({
  values: initialValues,
  ...props
}: React.ComponentProps<typeof ChoiceForecastEditor>) {
  const [values, setValues] = useState(initialValues);
  return (
    <ChoiceForecastEditor
      {...props}
      values={values}
      onChange={(optionId, value) =>
        setValues((prev) => ({ ...prev, [optionId]: value }))
      }
    />
  );
}

const meta = {
  title: "Forecast Card/ChoiceForecastEditor",
  component: ChoiceForecastEditor,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[520px] max-w-full">
        <Story />
      </div>
    ),
  ],
  render: (args) => <StatefulChoiceForecastEditor {...args} />,
  args: {
    onChange: () => {},
  },
  argTypes: {
    options: { control: false, description: "One row per option, in order" },
    values: {
      control: false,
      description: "option_id → probability 0..1, or null when unset",
    },
    onChange: {
      control: false,
      description: "Called with the option id and its new probability",
    },
  },
} satisfies Meta<typeof ChoiceForecastEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// `one_of`: two of four options filled, so the footer shows 40% remaining in
// the destructive token. Enter the last two to see it flip to "Adds up".
export const PickOne: Story = {
  args: {
    kind: "one_of",
    options: NBA_CHAMPION_OPTIONS,
    values: valuesFromOptions(NBA_CHAMPION_OPTIONS),
  },
};

// `any_of`: independent options, so there is no total footer at all.
export const AnyThatApply: Story = {
  args: {
    kind: "any_of",
    options: ECONOMY_OPTIONS,
    values: valuesFromOptions(ECONOMY_OPTIONS),
  },
};

// Read-only (forecasts closed): values render in mono instead of inputs.
export const Disabled: Story = {
  args: {
    kind: "one_of",
    options: NBA_CHAMPION_OPTIONS,
    values: { 1: 0.35, 2: 0.25, 3: 0.2, 4: 0.2 },
    disabled: true,
  },
};
