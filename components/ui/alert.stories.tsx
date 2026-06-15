import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";

const meta = {
  title: "UI/Alert",
  component: Alert,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[480px] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <Info className="h-4 w-4" />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        Forecasts close automatically at the deadline.
      </AlertDescription>
    </Alert>
  ),
};

// The error state shown by every form in the app on a failed submission.
export const Destructive: Story = {
  args: { variant: "destructive" },
  render: (args) => (
    <Alert {...args}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Submission failed</AlertTitle>
      <AlertDescription>
        Something went wrong while saving. Please try again.
      </AlertDescription>
    </Alert>
  ),
};

// Title only, no supporting copy.
export const TitleOnly: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>This competition is now closed.</AlertTitle>
    </Alert>
  ),
};
