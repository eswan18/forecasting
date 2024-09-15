"use client"

import { useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getFilteredRowModel,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input";

interface DataTableProps<TData, TValue> {
  getColumns: (allowResolutionEdits: boolean) => ColumnDef<TData, TValue>[]
  data: TData[]
  allowResolutionEdits?: boolean
}

export function DataTable<TData, TValue>({
  getColumns,
  data,
  allowResolutionEdits = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const columns = getColumns(allowResolutionEdits);
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
      columnFilters: [{ 'id': 'resolution', 'value': [] }],
    },
  })

  return (
    <>
      <div className="flex flex-col items-start p-4">
        <label>Filter by prop text:</label>
        <Input
          placeholder="Search for a prop..."
          value={(table.getColumn("prop_text")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("prop_text")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="flex flex-col items-start p-4">
        <label>Filter by resolution:</label>
        <div className="flex flex-row w-full h-9 py-1 text-sm">
          <ResolutionCheckboxFilter
            filterValue={table.getColumn("resolution")?.getFilterValue() as ResolutionOption[] | undefined}
            setFilterValue={(value) => table.getColumn("resolution")?.setFilterValue(value)}
            resolution="Yes"
          />
          <ResolutionCheckboxFilter
            filterValue={table.getColumn("resolution")?.getFilterValue() as ResolutionOption[] | undefined}
            setFilterValue={(value) => table.getColumn("resolution")?.setFilterValue(value)}
            resolution="No"
          />
          <ResolutionCheckboxFilter
            filterValue={table.getColumn("resolution")?.getFilterValue() as ResolutionOption[] | undefined}
            setFilterValue={(value) => table.getColumn("resolution")?.setFilterValue(value)}
            resolution="?"
          />
        </div>
      </div>
      <div className="rounded-md border w-full">
        <Table>
          <TableHeader className="bg-secondary">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} align={(cell.column.columnDef.meta as any)?.align}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

type ResolutionOption = "Yes" | "No" | "?";

function ResolutionCheckboxFilter({ filterValue, setFilterValue, resolution }: { filterValue?: ResolutionOption[], setFilterValue: (value: ResolutionOption[]) => void, resolution: ResolutionOption }) {
  return (
    <div className="flex flex-row justify-start items-center gap-2 w-16 mx-4">
      <Input
        type="checkbox"
        checked={filterValue?.includes(resolution) ?? false}
        onChange={(event) => {
          const prev = filterValue ?? []
          setFilterValue(event.target.checked
            ? [...prev, resolution]
            : prev.filter((v) => v !== resolution)
          )
        }}
        className="w-4 h-4 rounded-lg border-input"
      />
      <label className="text-muted-foreground">{resolution}</label>
    </div>
  )
}