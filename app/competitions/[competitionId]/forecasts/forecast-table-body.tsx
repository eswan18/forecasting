"use server";

import { getForecasts, VForecastsOrderByExpression } from "@/lib/db_actions";
import ForecastTableRow from "./forecast-table-row";
import { getUserFromCookies } from "@/lib/get-user";
import { VForecast } from "@/types/db_types";

export interface ForecastTableBodyProps {
  competitionId: number;
  userId?: number | undefined;
  resolution?: (boolean | null)[];
  sortColumn?: string;
  sortAsc?: boolean;
  propText?: string | undefined;
}

export default async function ForecastTableBody(
  { competitionId, userId, resolution, sortColumn, sortAsc, propText }:
    ForecastTableBodyProps,
) {
  const currentUser = await getUserFromCookies();
  let data = await getForecasts({
    userId,
    competitionId,
    resolution,
    sort: {
      expr: (sortColumn ?? "forecast") as VForecastsOrderByExpression,
      modifiers: sortAsc ? "asc" : "desc",
    },
  });
  // Filtering by prop text isn't supported in the db query so we do it here.
  if (propText) {
    data = data.filter((row) =>
      row.prop_text?.toLowerCase().includes(propText.toLowerCase())
    );
  }
  const isRowEditable = (row: VForecast) => {
    if (row.user_id === currentUser?.id) {
      if (
        row.competition_forecasts_due_date === null ||
        new Date() < row.competition_forecasts_due_date
      ) {
        return true;
      }
    }
    if (currentUser?.is_admin) {
      return true;
    }
    return false;
  };
  return (
    <ul className="w-full flex flex-col">
      {data.map((row) => (
        <li key={row.forecast_id}>
          <ForecastTableRow row={row} editable={isRowEditable(row)} />
        </li>
      ))}
    </ul>
  );
}
