"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  const chartData = [
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
    <Link href={`/competitions/${competitionId}/scores/user/${userId}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="py-4">
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
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Full score breakdown
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
            {/* Chart below */}
            <div className="h-28 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 50, bottom: 0 }}
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
                    tick={{ fontSize: 12 }}
                    width={45}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={12}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        className={
                          entry.isOverall
                            ? "fill-primary"
                            : "fill-muted-foreground/40"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
            <div className="w-2/3 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 60, bottom: 0 }}
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
                    tick={{ fontSize: 12 }}
                    width={55}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={12}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        className={
                          entry.isOverall
                            ? "fill-primary"
                            : "fill-muted-foreground/40"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
