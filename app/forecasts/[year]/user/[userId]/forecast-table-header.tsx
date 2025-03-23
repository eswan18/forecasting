import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ForecastTableHeader(
  { sortColumn, sortAsc, setSort }: {
    sortColumn: string;
    sortAsc: boolean;
    setSort: (column: string, asc: boolean) => void;
  },
) {
  const handleSortClick = (column: string) => {
    if (sortColumn === column) {
      // If clicking a column that's already sorted, flip the sort direction
      setSort(column, !sortAsc);
    } else {
      // If clicking a different column, sort on that column descending.
      setSort(column, false);
    }
  };
  return (
    <div className="w-full grid grid-cols-[1fr_1fr] sm:grid-cols-[2fr_1fr] px-4 pb-1 border-b text-muted-foreground">
      <div></div>
      <div className="col-span-1 grid grid-cols-[1fr_1fr_1fr] gap-x-1 text-right">
        <SortColumnHeader
          onClick={() => handleSortClick("resolution")}
          ascending={sortColumn === "resolution" ? sortAsc : undefined}
          className="justify-center sm:justify-end"
        />
        <SortColumnHeader
          onClick={() => handleSortClick("forecast")}
          ascending={sortColumn === "forecast" ? sortAsc : undefined}
        />
        <SortColumnHeader
          onClick={() => handleSortClick("penalty")}
          ascending={sortColumn === "penalty" ? sortAsc : undefined}
        />
      </div>
    </div>
  );
}

function SortColumnHeader(
  { onClick, ascending, className }: {
    onClick: () => void;
    ascending: boolean | undefined;
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
        {ascending === undefined
          ? <ArrowUpDown size={20} />
          : ascending
          ? <ArrowUp size={20} />
          : <ArrowDown size={20} />}
      </Button>
    </div>
  );
}
