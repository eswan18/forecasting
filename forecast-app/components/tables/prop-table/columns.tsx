"use client";

import { ColumnDef } from "@tanstack/react-table";
import { VProp } from "@/types/db_types";
import { ActionDropdown } from "./action-dropdown";

export function getColumns(
  allowResolutionEdits: boolean,
): ColumnDef<VProp>[] {
  return [
    {
      accessorKey: "prop_text",
      header: "Proposition",
      meta: { className: "min-w-[90%]" },
      cell: ({ row }) => {
        return (
          <div className="flex flex-col justify-start items-start gap-1">
            <div className="text-xs text-muted-foreground">
              {row.original.category_name}
            </div>
            <div>{row.original.prop_text}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "resolution",
      header: () => null,
      meta: { align: "center" },
      cell: ({ row }) => {
        const resolution = row.original.resolution;
        const resText = resolution === null ? "?" : resolution ? "Yes" : "No";
        return resText;
      },
      filterFn: (row, columnId, filterValue) => {
        if (filterValue.length === 3 || filterValue.length === 0) return true;
        switch (row.getValue("resolution")) {
          case true:
            return filterValue.includes("Yes");
          case false:
            return filterValue.includes("No");
          case null:
            return filterValue.includes("?");
        }
      },
    },
    {
      accessorKey: "action",
      header: () => null,
      cell: ({ row }) => {
        if (!allowResolutionEdits) return null;
        return (
          <ActionDropdown
            prop={row.original}
            resolution={row.original.resolution}
          />
        );
      },
    },
  ];
}
