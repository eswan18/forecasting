import type { Meta, StoryObj } from "@storybook/react-vite";
import { LeaderboardSidebar } from "./leaderboard-sidebar";
import type { CompetitionScore } from "@/lib/db_actions";

const scores: CompetitionScore = {
  overallScores: [
    { userId: 1, userName: "Avery Chen", score: 0.118 },
    { userId: 2, userName: "Jordan Blake", score: 0.142 },
    { userId: 3, userName: "Sam Rivera", score: 0.171 },
    { userId: 4, userName: "Taylor Okafor", score: 0.205 },
    { userId: 5, userName: "Morgan Diaz", score: 0.239 },
    { userId: 6, userName: "Priya Nair", score: 0.288 },
  ],
  categoryScores: [],
  incompleteUserIds: [5],
};

const meta = {
  title: "Competition/LeaderboardSidebar",
  component: LeaderboardSidebar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    scores: { control: false },
    currentUserId: { control: "number" },
  },
  args: {
    scores,
    competitionId: 6,
    currentUserId: null,
  },
} satisfies Meta<typeof LeaderboardSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Top entries; no current user highlighted. Morgan Diaz is incomplete.
export const Default: Story = {};

// The signed-in user sits mid-pack — emphasized with a "you" tag.
export const WithCurrentUser: Story = {
  args: { currentUserId: 3 },
};

// The current user is also the leader.
export const CurrentUserLeads: Story = {
  args: { currentUserId: 1 },
};

// No scores yet — empty state.
export const Empty: Story = {
  args: {
    scores: {
      overallScores: [],
      categoryScores: [],
      incompleteUserIds: [],
    },
  },
};
