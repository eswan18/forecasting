"use client";

import { useRouter } from "next/navigation";
import UserSelector from "./user-selector";
import { SearchState, searchStateAsURLSearchParams } from "./search-params";
import { Checkbox } from "@/components/ui/checkbox";
import ForecastTableHeader from "./forecast-table-header";
import { VUser } from "@/types/db_types";

export function ForecastTableInteractivePanel(
  { search, users }: { search: SearchState; users: VUser[] },
) {
  const router = useRouter();
  const updateQueryFromSearch = (search: SearchState) => {
    const params = searchStateAsURLSearchParams({search});
    router.push(`?${params.toString()}`);
  };
  const handleCheck = (checked: boolean) => {
    if (checked) {
      if (search.resolution.length === 0) {
        updateQueryFromSearch({
          ...search,
          resolution: [true, false],
        });
      } else {
        // Remove null from the filter
        updateQueryFromSearch({
          ...search,
          resolution: search.resolution.filter((r) => r !== null),
        });
      }
    } else {
      // Add null to the filter
      if (!search.resolution.includes(null)) {
        updateQueryFromSearch({
          ...search,
          resolution: [...search.resolution, null],
        });
      }
    }
  };
  return (
    <div className="flex flex-col w-full">
      <div className="w-full flex flex-row justify-center sm:justify-start px-2.5 items-center gap-x-2 text-muted-foreground mb-4 sm:mb-2">
        <UserSelector
          users={users}
          setUserId={(userId: number | undefined) => {
            updateQueryFromSearch({
              ...search,
              userId,
            });
          }}
        />
        <p>Hide unresolved props</p>
        <Checkbox
          checked={!search.resolution.includes(null)}
          onCheckedChange={handleCheck}
        />
      </div>
      <ForecastTableHeader
        sortColumn={search.sortColumn ?? "forecast"}
        sortAsc={search.sortAsc ?? true}
        setSort={(sortColumn, sortAsc) => {
          updateQueryFromSearch({
            ...search,
            sortColumn,
            sortAsc,
          });
        }}
      />
    </div>
  );
}
