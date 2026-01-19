"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { UserCategoryScore } from "@/lib/db_actions/competition-scores";
import { Category } from "@/types/db_types";

interface ScoreCardProps {
  rank: number;
  userId: number;
  userName: string;
  overallScore: number;
  categoryScores: UserCategoryScore[];
  categories: Category[];
  competitionId: number;
  maxScore: number;
}

interface ChartDataItem {
  name: string;
  score: number;
  isOverall: boolean;
}

interface ScoreBarChartProps {
  data: ChartDataItem[];
  maxScore: number;
  fontSize: number;
  rightMargin: number;
}

function ScoreBarChart({
  data,
  maxScore,
  fontSize,
  rightMargin,
}: ScoreBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: rightMargin, left: 10, bottom: 0 }}
      >
        <XAxis
          type="number"
          domain={[0, Math.ceil(maxScore * 10) / 10]}
          hide
        />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize }}
          width={95}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={12}>
          {data.map((entry) => (
            <Cell
              key={entry.name}
              className={
                entry.isOverall ? "fill-primary" : "fill-muted-foreground/40"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function ScoreCard({
  rank,
  userId,
  userName,
  overallScore,
  categoryScores,
  categories,
  competitionId,
  maxScore,
}: ScoreCardProps) {
  // Build chart data with Overall first, then categories
  const chartData: ChartDataItem[] = [
    { name: "Overall", score: overallScore, isOverall: true },
    ...categoryScores.map((cs) => {
      const category = categories.find((c) => c.id === cs.categoryId);
      return {
        name: category?.name || "Unknown",
        score: cs.score,
        isOverall: false,
      };
    }),
  ];

  return (
    <Link
      href={`/competitions/${competitionId}/scores/user/${userId}`}
      aria-label={`View detailed scores for ${userName}`}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent>
          {/* Mobile layout */}
          <div className="flex flex-col md:hidden">
            {/* Top row: name/score on left, link on right */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-lg text-muted-foreground">{rank}.</span>
                <span className="text-lg font-semibold truncate">
                  {userName}
                </span>
                <span className="text-xl font-bold ml-2">
                  {overallScore.toFixed(2)}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            {/* Chart below */}
            <div className="h-28 mt-3">
              <ScoreBarChart
                data={chartData}
                maxScore={maxScore}
                fontSize={11}
                rightMargin={10}
              />
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:flex items-center gap-4">
            {/* Left side: rank, name, score, link */}
            <div className="flex flex-col w-1/3">
              <div className="flex items-baseline gap-2">
                <span className="text-lg text-muted-foreground">{rank}.</span>
                <span className="text-lg font-semibold truncate">
                  {userName}
                </span>
                <span className="text-xl font-bold ml-2">
                  {overallScore.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                Full score breakdown
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            {/* Right side: horizontal bar chart */}
            <div className="w-2/3 h-32">
              <ScoreBarChart
                data={chartData}
                maxScore={maxScore}
                fontSize={12}
                rightMargin={30}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
