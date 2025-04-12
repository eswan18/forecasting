"use client";

import { useState } from "react";
import {
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { VUser } from "@/types/db_types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getColumns } from "./columns";

export default function UsersTable({ data }: { data: VUser[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  // The columns object needs access to `mutateUser`, which can only be accessed in a client component.
  const { mutate: mutateUser } = useCurrentUser();
  const columns = getColumns({ mutateUser });
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
    <div className="rounded-md border w-full mt-8">
      <Table>
        <TableHeader className="bg-muted text-muted-foreground">
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
  );
}

type ResolutionOption = "Yes" | "No" | "?";

function ResolutionCheckboxFilter(
  { filterValue, setFilterValue, resolution }: {
    filterValue?: ResolutionOption[];
    setFilterValue: (value: ResolutionOption[]) => void;
    resolution: ResolutionOption;
  },
) {
  return (
    <div className="flex flex-row justify-start items-center gap-1.5">
      <Checkbox
        id={resolution}
        checked={filterValue?.includes(resolution) ?? false}
        onCheckedChange={(checked) => {
          const prev = filterValue ?? [];
          setFilterValue(
            checked
              ? [...prev, resolution]
              : prev.filter((v) => v !== resolution),
          );
        }}
      />
      <Label htmlFor={resolution} className="text-muted-foreground">
        {resolution}
      </Label>
    </div>
  );
}
