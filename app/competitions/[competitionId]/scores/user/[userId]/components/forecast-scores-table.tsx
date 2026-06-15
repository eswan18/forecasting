"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TableByCategory } from "./table-by-category";
import { TableByPenalty } from "./table-by-penalty";
import type { Category } from "@/types/db_types";
import type { UserForecastScore, UserCategoryScore } from "@/lib/db_actions";

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
    <section className="w-full overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Forecast Penalties
        </span>
        <div className="flex items-center gap-2.5">
          <Label
            htmlFor="by-category"
            className="cursor-pointer text-xs text-muted-foreground"
          >
            By category
          </Label>
          <Switch
            id="by-category"
            checked={byCategory}
            onCheckedChange={setByCategory}
          />
        </div>
      </div>
      <div className="overflow-x-auto px-2 py-1 sm:px-3">
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
    </section>
  );
}
