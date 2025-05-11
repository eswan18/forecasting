"use server";

import {
  parseSearchParamsAsState,
  SearchParams,
  SearchState,
} from "./search-params";
import ForecastTableBody from "./forecast-table-body";
import { VUser } from "@/types/db_types";
import { ForecastTableInteractivePanel } from "./forecast-table-interactive-panel";

interface ForecastTableProps {
  competitionId: number;
  searchParams: SearchParams;
  users: VUser[];
}

export default async function ForecastTable(
  { competitionId, searchParams, users }: ForecastTableProps,
) {
  const search = parseSearchParamsAsState({ params: searchParams });
  const forecastTableBodyProps = {
    ...search,
    competitionId,
  };
  return (
    <div className="w-full">
      <ForecastTableInteractivePanel
        search={search}
        users={users}
      />
      <ForecastTableBody {...forecastTableBodyProps} />
    </div>
  );
}
