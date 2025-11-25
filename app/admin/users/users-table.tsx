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
      columnFilters: [{ id: "resolution", value: [] }],
    },
  });

  return (
    <div className="w-full min-w-[600px]">
      <Table>
        <TableHeader className="bg-muted/30">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="font-semibold text-muted-foreground text-xs sm:text-sm"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
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
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="border-b hover:bg-muted/20 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    align={(cell.column.columnDef.meta as any)?.align}
                    className="py-3 sm:py-4 text-xs sm:text-sm"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground text-sm"
              >
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
