import { Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import type { Category } from "@/types/db_types";
import type { UserForecastScore, UserCategoryScore } from "@/lib/db_actions";
import { ForecastScoreRow, ScoreTableHead } from "./score-table-parts";

interface TableByCategoryProps {
  sortedCategoryEntries: Array<[number | "uncategorized", UserForecastScore[]]>;
  sortedCategoryScores: UserCategoryScore[];
  categories: Category[];
}

export function TableByCategory({
  sortedCategoryEntries,
  sortedCategoryScores,
  categories,
}: TableByCategoryProps) {
  return (
    <Table>
      <ScoreTableHead />
      <TableBody>
        {sortedCategoryEntries.map(([categoryKey, forecasts]) => {
          const categoryId =
            categoryKey === "uncategorized" ? null : categoryKey;
          const category =
            categoryId !== null
              ? categories.find((cat) => cat.id === categoryId)
              : null;

          // Find the category score for this category
          const categoryScore = sortedCategoryScores.find(
            (cs) =>
              (cs.categoryId === categoryId && categoryId !== null) ||
              (cs.categoryId === null && categoryId === null),
          );

          return (
            <Fragment key={`category-${categoryKey}`}>
              {/* Category header row: mono kicker label + aggregate penalty */}
              <TableRow className="border-y bg-muted/40 hover:bg-muted/40">
                <TableCell
                  colSpan={3}
                  className="py-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                >
                  {category?.name || "Uncategorized"}
                </TableCell>
                <TableCell className="py-2 text-right font-mono font-medium tabular-nums text-foreground">
                  {categoryScore ? categoryScore.score.toFixed(3) : "—"}
                </TableCell>
              </TableRow>
              {/* Forecast rows */}
              {forecasts.map((forecast) => (
                <ForecastScoreRow
                  key={forecast.forecastId}
                  forecast={forecast}
                />
              ))}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
