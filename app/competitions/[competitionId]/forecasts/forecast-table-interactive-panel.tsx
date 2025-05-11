"use client";

import { useRouter } from "next/navigation";
import UserSelector from "./user-selector";
import { SearchState, searchStateAsURLSearchParams } from "./search-params";
import { Checkbox } from "@/components/ui/checkbox";
import ForecastTableHeader from "./forecast-table-header";
import { VUser } from "@/types/db_types";
import PropFilterInput from "./prop-filter-input";

export function ForecastTableInteractivePanel(
  { search, users }: { search: SearchState; users: VUser[] },
) {
  const router = useRouter();
  const updateQueryFromSearch = (newSearch: SearchState) => {
    const params = searchStateAsURLSearchParams({ search: newSearch });
    const queryString = params.toString();
    if (queryString !== window.location.search.replace(/^\?/, "")) {
      router.push(`?${queryString}`);
    }
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
      <div className="w-full flex flex-row justify-center sm:justify-start px-2.5 items-center gap-x-2 md:gap-x-4 text-muted-foreground mb-4 sm:mb-2">
        <UserSelector
          users={users}
          setUserId={(userId: number | undefined) => {
            updateQueryFromSearch({
              ...search,
              userId,
            });
          }}
        />
        <PropFilterInput
          initialSearchString={search.propText || ""}
          onSearchStringChange={(searchString) => {
            updateQueryFromSearch({
              ...search,
              propText: searchString,
            });
          }}
        />
        <div className="flex flex-row items-center gap-x-2 min-w-36">
          <p className="text-muted-foreground text-sm break">
            Hide unresolved
          </p>
          <Checkbox
            checked={!search.resolution.includes(null)}
            onCheckedChange={handleCheck}
          />
        </div>
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
