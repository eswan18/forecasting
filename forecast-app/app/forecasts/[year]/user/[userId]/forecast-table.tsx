"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export type ScoredForecast = {
  category_id: number;
  category_name: string;
  prop_id: number;
  prop_text: string;
  prop_notes: string | null;
  resolution: boolean | null;
  user_id: number;
  forecast: number;
  forecast_id: number;
  penalty: number | null;
  year: number;
};

interface SortStatus {
  column: string;
  direction: "asc" | "desc";
}

interface FilterStatus {
  resolution: (boolean | null)[];
}

interface ForecastTableProps {
  data: ScoredForecast[];
  editable: boolean;
}

export default function ForecastTable(
  { data, editable }: ForecastTableProps,
) {
  const [sortStatus, setSortStatus] = useState<SortStatus | null>(null);
  const [filter, setFilter] = useState<FilterStatus>({
    resolution: [true, false],
  });
  // Filters
  if (filter.resolution.length !== 3) {
    data = data.filter((row) => filter.resolution.includes(row.resolution));
  }
  // Sort
  if (sortStatus !== null) {
    data = data.sort((a, b) => {
      if (sortStatus?.direction === "asc") {
        switch (sortStatus.column) {
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
      } else if (sortStatus?.direction === "desc") {
        switch (sortStatus.column) {
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
      return 0;
    });
  }
  return (
    <div className="w-full">
      <ForecastTableFilterPanel filter={filter} setFilter={setFilter} />
      <ForecastTableHeader
        sortStatus={sortStatus}
        setSortStatus={setSortStatus}
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

function ForecastTableFilterPanel({ filter, setFilter }: {
  filter: FilterStatus;
  setFilter: Dispatch<SetStateAction<FilterStatus>>;
}) {
  const handleCheck = (checked: boolean) => {
    if (checked) {
      setFilter({ resolution: [true, false] });
    } else {
      setFilter({ resolution: [true, false, null] });
    }
  };
  return (
    <div className="w-full flex flex-row justify-center sm:justify-start px-2.5 items-center gap-x-2 text-muted-foreground mb-4 sm:mb-2">
      <p>Hide unresolved props</p>
      <Checkbox
        checked={!filter.resolution.includes(null)}
        onCheckedChange={handleCheck}
      />
    </div>
  );
}

function ForecastTableHeader(
  { sortStatus, setSortStatus }: {
    sortStatus: SortStatus | null;
    setSortStatus: Dispatch<SetStateAction<SortStatus | null>>;
  },
) {
  const handleSortClick = (column: string) => {
    setSortStatus((prev) => {
      if (prev && prev.column === column) {
        return {
          column,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      } else {
        return { column, direction: "desc" };
      }
    });
  };
  return (
    <div className="w-full grid grid-cols-[1fr_1fr] sm:grid-cols-[2fr_1fr] px-4 pb-1 border-b text-muted-foreground">
      <div></div>
      <div className="col-span-1 grid grid-cols-[1fr_1fr_1fr] gap-x-1 text-right">
        <SortColumnHeader
          onClick={() => handleSortClick("resolution")}
          selection={sortStatus?.column === "resolution"
            ? sortStatus.direction
            : undefined}
          className="justify-center sm:justify-end"
        />
        <SortColumnHeader
          onClick={() => handleSortClick("forecast")}
          selection={sortStatus?.column === "forecast"
            ? sortStatus.direction
            : undefined}
        />
        <SortColumnHeader
          onClick={() => handleSortClick("penalty")}
          selection={sortStatus?.column === "penalty"
            ? sortStatus.direction
            : undefined}
        />
      </div>
    </div>
  );
}

function SortColumnHeader(
  { onClick, selection, className }: {
    onClick: () => void;
    selection: "asc" | "desc" | undefined;
    className?: string;
  },
) {
  className = cn("w-full flex flex-row items-end justify-end", className);
  return (
    <div className={className}>
      <Button
        variant="ghost"
        className="h-6 p-0 flex flex-row gap-x-1 m-0"
        onClick={onClick}
      >
        <span className="hidden sm:inline">Sort</span>
        {selection === undefined
          ? <ArrowUpDown size={20} />
          : selection === "asc"
          ? <ArrowUp size={20} />
          : <ArrowDown size={20} />}
      </Button>
    </div>
  );
}

function ForecastTableRow(
  { row, editable }: { row: ScoredForecast; editable: boolean },
) {
  const resolution = row.resolution !== null
    ? (
      row.resolution
        ? (
          <Check
            size={20}
            strokeWidth={3}
            className="-translate-y-1.5 text-green-500"
          />
        )
        : (
          <X
            size={20}
            strokeWidth={3}
            className="-translate-y-1.5 text-destructive"
          />
        )
    )
    : <p className="text-muted-foreground">?</p>;
  const penaltyString = row.penalty !== null
    ? <p>{row.penalty.toFixed(2)}</p>
    : <p className="text-muted-foreground">?</p>;
  return (
    <div className="w-full bg-card grid grid-cols-[1fr_1fr] sm:grid-cols-[2fr_1fr] px-4 py-4 border gap-x-1">
      <div className="flex flex-col gap-y-1">
        <p>{row.prop_text}</p>
        <p className="text-muted-foreground text-sm">{row.category_name}</p>
      </div>
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-x-1 text-right">
        <div className="w-full flex flex-row items-end justify-center sm:justify-end text-lg font-bold">
          {resolution}
        </div>
        <div className="w-full flex flex-row items-end justify-end text-lg font-bold">
          {row.forecast.toFixed(2)}
        </div>
        <div className="w-full flex flex-row items-end justify-end text-lg font-bold">
          {penaltyString}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="hidden sm:inline">Resolution</span>
        </p>
        <p className="text-xs text-muted-foreground">Predicted</p>
        <p className="text-xs text-muted-foreground">Penalty</p>
      </div>
    </div>
  );
}
