import type { Meta, StoryObj } from "@storybook/react-vite";
import BoldTakesContent from "./bold-takes-content";

// Renders inside the same flat card chrome as the real Stats page.
const CardFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-96 w-80 flex-col gap-4 rounded-lg border bg-card p-6">
    <div>
      <div className="font-semibold">Boldest Takes</div>
      <div className="text-sm text-muted-foreground">Straying from the pack.</div>
    </div>
    {children}
  </div>
);

const meta = {
  title: "Competition/BoldTakesCard",
  component: BoldTakesContent,
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
    takes: { control: false },
  },
  args: {
    takes: [
      {
        forecastId: 1,
        propText: "Will headline inflation fall below 3% by year-end?",
        userName: "Avery Chen",
        userForecast: 0.85,
        meanForecast: 0.32,
        differenceFromMean: 0.53,
      },
      {
        forecastId: 2,
        propText: "Will the home team make the playoffs?",
        userName: "Jordan Blake",
        userForecast: 0.1,
        meanForecast: 0.58,
        differenceFromMean: 0.48,
      },
      {
        forecastId: 3,
        propText: "Will a third-party candidate exceed 5% of the vote?",
        userName: "Sam Rivera",
        userForecast: 0.6,
        meanForecast: 0.18,
        differenceFromMean: 0.42,
      },
      {
        forecastId: 4,
        propText: "Will the central bank cut rates at its next meeting?",
        userName: "Taylor Okafor",
        userForecast: 0.7,
        meanForecast: 0.4,
        differenceFromMean: 0.3,
      },
    ],
  },
} satisfies Meta<typeof BoldTakesContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// The biggest divergences from the crowd, sorted furthest-first.
export const Default: Story = {};
