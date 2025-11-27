"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TableByCategory } from "./table-by-category";
import { TableByPenalty } from "./table-by-penalty";
import { Category } from "@/types/db_types";
import { UserForecastScore, UserCategoryScore } from "@/lib/db_actions";

interface ForecastScoresTableProps {
  sortedCategoryEntries: Array<[number | "uncategorized", UserForecastScore[]]>;
  sortedCategoryScores: UserCategoryScore[];
  sortedForecasts: UserForecastScore[];
  categories: Category[];
}

export function ForecastScoresTable({
  sortedCategoryEntries,
  sortedCategoryScores,
  sortedForecasts,
  categories,
}: ForecastScoresTableProps) {
  const [byCategory, setByCategory] = useState(true);

  return (
    <>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Forecast Penalties</CardTitle>
        <div className="flex items-center gap-3">
          <Label htmlFor="by-category" className="cursor-pointer">
            By Category
          </Label>
          <Switch
            id="by-category"
            checked={byCategory}
            onCheckedChange={setByCategory}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {byCategory ? (
            <TableByCategory
              sortedCategoryEntries={sortedCategoryEntries}
              sortedCategoryScores={sortedCategoryScores}
              categories={categories}
            />
          ) : (
            <TableByPenalty sortedForecasts={sortedForecasts} />
          )}
        </div>
      </CardContent>
    </>
  );
}
