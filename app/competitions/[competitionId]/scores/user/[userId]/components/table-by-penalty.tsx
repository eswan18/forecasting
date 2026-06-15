import { Table, TableBody } from "@/components/ui/table";
import type { UserForecastScore } from "@/lib/db_actions";
import { ForecastScoreRow, ScoreTableHead } from "./score-table-parts";

interface TableByPenaltyProps {
  sortedForecasts: UserForecastScore[];
}

export function TableByPenalty({ sortedForecasts }: TableByPenaltyProps) {
  return (
    <Table>
      <ScoreTableHead />
      <TableBody>
        {sortedForecasts.map((forecast) => (
          <ForecastScoreRow key={forecast.forecastId} forecast={forecast} />
        ))}
      </TableBody>
    </Table>
  );
}
