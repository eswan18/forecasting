import type { Meta, StoryObj } from "@storybook/react-vite";
import CertaintyContent from "./certainty-content";

// Renders inside the same flat card chrome as the real Stats page.
const CardFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-96 w-80 flex-col gap-4 rounded-lg border bg-card p-6">
    <div>
      <div className="font-semibold">Average Certainty</div>
      <div className="text-sm text-muted-foreground">Who&apos;s confident?</div>
    </div>
    {children}
  </div>
);

const meta = {
  title: "Competition/CertaintyCard",
  component: CertaintyContent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <CardFrame>
        <Story />
      </CardFrame>
    ),
  ],
  argTypes: {
    certainties: { control: false },
  },
  args: {
    certainties: [
      { userId: 1, userName: "Avery Chen", avgCertainty: 0.412 },
      { userId: 2, userName: "Jordan Blake", avgCertainty: 0.357 },
      { userId: 3, userName: "Sam Rivera", avgCertainty: 0.298 },
      { userId: 4, userName: "Taylor Okafor", avgCertainty: 0.241 },
      { userId: 5, userName: "Morgan Diaz", avgCertainty: 0.19 },
      { userId: 6, userName: "Priya Nair", avgCertainty: 0.142 },
    ],
  },
} satisfies Meta<typeof CertaintyContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Most-certain first (the default). Toggle the header button to reverse.
export const Default: Story = {};
