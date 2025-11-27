import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Category } from "@/types/db_types";
import { UserForecastScore, UserCategoryScore } from "@/lib/db_actions";

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
      <TableHeader>
        <TableRow>
          <TableHead>Proposition</TableHead>
          <TableHead className="text-right">Forecast</TableHead>
          <TableHead className="text-right">Resolution</TableHead>
          <TableHead className="text-right">Penalty</TableHead>
        </TableRow>
      </TableHeader>
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
            <>
              {/* Category Header Row */}
              <TableRow key={`category-${categoryKey}`}>
                <TableCell
                  colSpan={3}
                  className="font-semibold text-lg bg-muted/50 py-3"
                >
                  {category?.name || "Uncategorized"}
                </TableCell>
                <TableCell className="text-right font-semibold text-lg bg-muted/50 py-3">
                  {categoryScore ? categoryScore.score.toFixed(3) : "-"}
                </TableCell>
              </TableRow>
              {/* Forecast Rows */}
              {forecasts.map((forecast) => (
                <TableRow key={forecast.forecastId}>
                  <TableCell className="max-w-md">
                    <div className="flex items-center gap-2">
                      <div className="truncate flex-1">{forecast.propText}</div>
                      <Link
                        href={`/props/${forecast.propId}`}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {(forecast.forecast * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {forecast.resolution === null
                      ? "-"
                      : forecast.resolution
                        ? "Yes"
                        : "No"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {forecast.score !== null ? forecast.score.toFixed(3) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </>
          );
        })}
      </TableBody>
    </Table>
  );
}
