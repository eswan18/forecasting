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
import { UserForecastScore } from "@/lib/db_actions";

interface TableByPenaltyProps {
  sortedForecasts: UserForecastScore[];
}

export function TableByPenalty({ sortedForecasts }: TableByPenaltyProps) {
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
        {sortedForecasts.map((forecast) => (
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
      </TableBody>
    </Table>
  );
}
