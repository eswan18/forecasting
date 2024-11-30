"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScoredForecast, useForecastColumns } from "./forecast-columns";

interface DataTableProps {
  data: ScoredForecast[];
  editable: boolean;
}

export default function ForecastTable({ data, editable }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const columns = useForecastColumns(editable);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
    initialState: {
      columnFilters: [{ "id": "resolution", "value": [] }],
    },
  });
  return (
    <>
      <div className="flex flex-col justify-start px-1 gap-4">
        <div className="flex flex-col gap-3">
          <Label>Filter by proposition text:</Label>
          <Input
            placeholder="Search for a prop..."
            value={(table.getColumn("prop_text")?.getFilterValue() as string) ??
              ""}
            onChange={(event) =>
              table.getColumn("prop_text")?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label>Filter by resolution:</Label>
          <div className="flex flex-row w-full text-sm gap-6">
            <ResolutionFilter
              filterValue={table.getColumn("resolution")?.getFilterValue() as
                | ResolutionOption[]
                | undefined}
              setFilterValue={(value) =>
                table.getColumn("resolution")?.setFilterValue(value)}
            />
          </div>
        </div>
      </div>
      <div className="rounded-md border w-full mt-8">
        <Table>
          <TableHeader className="bg-secondary text-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length
              ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        align={(cell.column.columnDef.meta as any)?.align}
                        className="text-xs"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )
              : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

type ResolutionOption = "Yes" | "No" | "?";

function ResolutionFilter(
  { filterValue, setFilterValue }: {
    filterValue: ResolutionOption[] | undefined;
    setFilterValue: (value: ResolutionOption[]) => void;
  },
) {
  const resolutions: ResolutionOption[] = ["Yes", "No", "?"];
  const addResolutionToFilter = (resolution: ResolutionOption) => {
    const prev = filterValue ?? [];
    setFilterValue(
      prev.includes(resolution)
        ? prev.filter((v) => v !== resolution)
        : [...prev, resolution],
    );
  };
  const removeResolutionFromFilter = (resolution: ResolutionOption) => {
    const prev = filterValue ?? [];
    setFilterValue(prev.filter((v) => v !== resolution));
  };
  return (
    <div className="flex flex-row w-full text-sm gap-6">
      {resolutions.map((resolution) => (
        <div
          key={resolution}
          className="flex flex-row justify-start items-center gap-1.5"
        >
          <Checkbox
            id={resolution}
            checked={filterValue?.includes(resolution) ?? false}
            onCheckedChange={(checked) =>
              checked
                ? addResolutionToFilter(resolution)
                : removeResolutionFromFilter(resolution)}
          />
          <Label htmlFor={resolution} className="text-muted-foreground">
            {resolution}
          </Label>
        </div>
      ))}
    </div>
  );
}
