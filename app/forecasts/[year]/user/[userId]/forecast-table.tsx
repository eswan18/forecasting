"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

import ForecastTableHeader from "./forecast-table-header";
import ForecastTableRow, { ScoredForecast } from "./forecast-table-row";

interface ForecastTableSearchParams {
  sortColumn: string;
  sortAsc: boolean;
  resolution: (boolean | null)[];
}

interface ForecastTableProps {
  data: ScoredForecast[];
  editable: boolean;
}

export default function ForecastTable(
  { data, editable }: ForecastTableProps,
) {
  const router = useRouter();
  const pathName = usePathname();
  const rawSearchParams = useSearchParams();
  const searchParams: ForecastTableSearchParams = {
    sortColumn: rawSearchParams.get("sortColumn") || "forecast",
    sortAsc: rawSearchParams.get("sortAsc") === "true",
    resolution: rawSearchParams.getAll("resolution").map((value) => {
      if (value === "true") return true;
      else if (value === "false") return false;
      else return null;
    }),
  };
  if (searchParams.resolution.length === 0) {
    // If no resolution filters are set, that means we use the default: show only
    // resolved props, which are [true, false],
    searchParams.resolution = [true, false];
  }
  const setResolutionFilter = (filter: (boolean | null)[]) => {
    searchParams.resolution = filter;
    updateSearchParams(searchParams);
  };
  const setSort = (column: string, asc: boolean) => {
    searchParams.sortColumn = column;
    searchParams.sortAsc = asc;
    updateSearchParams(searchParams);
  };
  const updateSearchParams = (params: ForecastTableSearchParams) => {
    const searchParams = new URLSearchParams();
    if (params.sortColumn && params.sortColumn !== "forecast") {
      searchParams.set("sortColumn", params.sortColumn);
    }
    if (params.sortAsc) searchParams.set("sortAsc", "true");
    if (
      !(params.resolution.includes(true) && params.resolution.includes(false) &&
        !params.resolution.includes(null))
    ) {
      // Only add resolution filter if it's not the default
      params.resolution.forEach((value) => {
        if (value === null) {
          searchParams.append("resolution", "null");
        } else {
          searchParams.append("resolution", value.toString());
        }
      });
    }
    router.push(`${pathName}?${searchParams.toString()}`);
  };
  // Filter
  if (searchParams.resolution.length !== 0) {
    data = data.filter((row) =>
      searchParams.resolution.includes(row.resolution)
    );
  }
  // Sort
  console.log(searchParams.sortColumn);
  console.log(searchParams.sortAsc);
  if (searchParams.sortColumn !== null) {
    data = data.sort((a, b) => {
      if (searchParams.sortAsc) {
        switch (searchParams.sortColumn) {
          case "forecast":
            return a.forecast > b.forecast ? 1 : -1;
          case "resolution":
            const aResolution = a.resolution === null ? -1 : +a.resolution;
            const bResolution = b.resolution === null ? -1 : +b.resolution;
            if (aResolution === bResolution) return 0;
            return aResolution > bResolution ? 1 : -1;
          case "penalty":
            const aPenalty = a.penalty === null ? 0 : a.penalty;
            const bPenalty = b.penalty === null ? 0 : b.penalty;
            if (a.penalty === b.penalty) return 0;
            return aPenalty > bPenalty ? 1 : -1;
          default:
            return 0;
        }
      } else {
        switch (searchParams.sortColumn) {
          case "forecast":
            return a.forecast < b.forecast ? 1 : -1;
          case "resolution":
            const aResolution = a.resolution === null ? -1 : +a.resolution;
            const bResolution = b.resolution === null ? -1 : +b.resolution;
            if (aResolution === bResolution) return 0;
            return aResolution < bResolution ? 1 : -1;
          case "penalty":
            const aPenalty = a.penalty === null ? 0 : a.penalty;
            const bPenalty = b.penalty === null ? 0 : b.penalty;
            if (a.penalty === b.penalty) return 0;
            return aPenalty < bPenalty ? 1 : -1;
          default:
            return 0;
        }
      }
    });
  }
  return (
    <div className="w-full">
      <ForecastTableFilterPanel
        resolutionFilter={searchParams.resolution}
        setResolutionFilter={setResolutionFilter}
      />
      <ForecastTableHeader
        sortColumn={searchParams.sortColumn ?? "forecast"}
        sortAsc={searchParams.sortAsc ?? true}
        setSort={setSort}
      />
      <ul className="w-full flex flex-col">
        {data.map((row) => (
          <li key={row.forecast_id}>
            <ForecastTableRow row={row} editable={editable} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ForecastTableFilterPanel(
  { resolutionFilter, setResolutionFilter }: {
    resolutionFilter: (boolean | null)[];
    setResolutionFilter: (filter: (boolean | null)[]) => void;
  },
) {
  const handleCheck = (checked: boolean) => {
    if (checked) {
      if (resolutionFilter.length === 0) {
        setResolutionFilter([true, false]);
      } else {
        // Remove null from the filter
        setResolutionFilter(resolutionFilter.filter((value) => value !== null));
      }
    } else {
      // Add null to the filter
      if (!resolutionFilter.includes(null)) {
        setResolutionFilter([...resolutionFilter, null]);
      }
    }
  };
  return (
    <div className="w-full flex flex-row justify-center sm:justify-start px-2.5 items-center gap-x-2 text-muted-foreground mb-4 sm:mb-2">
      <p>Hide unresolved props</p>
      <Checkbox
        checked={!resolutionFilter.includes(null)}
        onCheckedChange={handleCheck}
      />
    </div>
  );
}
