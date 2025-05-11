"use server";

import { getForecasts, VForecastsOrderByExpression } from "@/lib/db_actions";
import ForecastTableRow from "./forecast-table-row";

export interface ForecastTableBodyProps {
  competitionId: number;
  userId?: number | undefined;
  resolution?: (boolean | null)[];
  sortColumn?: string;
  sortAsc?: boolean;
}

export default async function ForecastTableBody(
  { competitionId, userId, resolution, sortColumn, sortAsc }:
    ForecastTableBodyProps,
) {
  const data = await getForecasts({
    userId,
    competitionId,
    resolution,
    sort: {
      expr: (sortColumn ?? "forecast") as VForecastsOrderByExpression,
      modifiers: sortAsc ? "asc" : "desc",
    },
  });
  return (
    <ul className="w-full flex flex-col">
      {data.map((row) => (
        <li key={row.forecast_id}>
          <ForecastTableRow row={row} editable={false} />
        </li>
      ))}
    </ul>
  );
}
