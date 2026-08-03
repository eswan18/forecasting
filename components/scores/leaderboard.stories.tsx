import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import Leaderboard from "./leaderboard";
import type { CompetitionScore } from "@/lib/db_actions";
import type { Category } from "@/types/db_types";

const D = new Date("2026-01-01T00:00:00Z");
const categories: Category[] = [
  { id: 1, name: "Politics", updated_at: D, created_at: D },
  { id: 2, name: "Sports", updated_at: D, created_at: D },
  { id: 3, name: "Economics", updated_at: D, created_at: D },
];

const users = [
  { userId: 1, userName: "Avery Chen", score: 0.118 },
  { userId: 2, userName: "Jordan Blake", score: 0.142 },
  { userId: 3, userName: "Sam Rivera", score: 0.171 },
  { userId: 4, userName: "Taylor Okafor", score: 0.205 },
  { userId: 5, userName: "Morgan Diaz", score: 0.239 },
  { userId: 6, userName: "Priya Nair", score: 0.288 },
];

// One category score per user per category so the expanded breakdown has data.
const categoryScores = users.flatMap((u, i) =>
  categories.map((c, j) => ({
    userId: u.userId,
    userName: u.userName,
    categoryId: c.id,
    score: Math.min(0.9, Math.max(0.02, u.score + (j - 1) * 0.05 + i * 0.005)),
  })),
);

const scores: CompetitionScore = {
  overallScores: users,
  categoryScores,
  incompleteUserIds: [5],
};

const meta = {
  title: "Competition/Leaderboard",
  component: Leaderboard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    scores: { control: false },
    categories: { control: false },
    currentUserId: { control: "number" },
    userForecastCount: { control: "number" },
    showIncomplete: { control: "boolean" },
    onShowIncompleteChange: { control: false },
  },
  args: {
    scores,
    categories,
    competitionId: 6,
    currentUserId: null,
    userForecastCount: 24,
    showIncomplete: false,
    onShowIncompleteChange: () => {},
  },
} satisfies Meta<typeof Leaderboard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default view: Morgan Diaz (incomplete) is filtered out, so five of six
// forecasters show and the toggle reads "(1)". No signed-in user, so there's no
// "Your Performance" card. Click a row to expand its category breakdown.
export const Default: Story = {};

// Toggle flipped on — Morgan Diaz reappears, marked with the dashed circle, and
// the footnote explaining the marker comes back.
export const ShowingIncomplete: Story = {
  args: { showIncomplete: true },
};

// Signed-in user mid-pack — adds the "Your Performance" card and highlights the row.
export const WithCurrentUser: Story = {
  args: { currentUserId: 3 },
};

// The signed-in user is the incomplete one. Their row is filtered out, but the
// "Your Performance" card stays — rank reads "—" with a note explaining why.
export const CurrentUserIncomplete: Story = {
  args: { currentUserId: 5 },
};

// Nobody has forecasted everything, so the filter empties the board. The toggle
// stays reachable so you can get back to a populated view.
export const AllIncomplete: Story = {
  args: {
    scores: { ...scores, incompleteUserIds: users.map((u) => u.userId) },
  },
};

// Clicking the switch actually filters.
export const Interactive: Story = {
  render: (args) => {
    const [showIncomplete, setShowIncomplete] = useState(false);
    return (
      <Leaderboard
        {...args}
        showIncomplete={showIncomplete}
        onShowIncompleteChange={setShowIncomplete}
      />
    );
  },
};

// Fewer than three forecasters — the podium is hidden.
export const TwoForecasters: Story = {
  args: {
    scores: {
      overallScores: users.slice(0, 2),
      categoryScores: categoryScores.filter((cs) => cs.userId <= 2),
      incompleteUserIds: [],
    },
  },
};

// No scores yet — empty state.
export const Empty: Story = {
  args: {
    scores: { overallScores: [], categoryScores: [], incompleteUserIds: [] },
  },
};
