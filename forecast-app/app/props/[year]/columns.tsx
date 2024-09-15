"use client";

import { ArrowUpDown } from "lucide-react"
import { MoreHorizontal } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table"
import { PropAndResolution } from "@/lib/db_actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveProp, unresolveProp } from "@/lib/db_actions";

export const columns: ColumnDef<PropAndResolution>[] = [
  {
    accessorKey: 'prop_text',
    header: 'Proposition',
  },
  {
    accessorKey: 'resolution',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Resolution
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    meta: { align: 'center' },
    cell: ({ row }) => {
      const propId = row.original.prop_id;
      const resolution = row.original.resolution;
      const resText = resolution === null ? '?' : resolution ? 'Yes' : 'No';
      return (
        <div className="flex flex-row items-center gap-1 justify-end px-4">
          <span>{resText}</span>
          <ActionDropdown propId={propId} resolution={resolution} />
        </div>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      if (filterValue.length === 3 || filterValue.length === 0) return true;
      switch (row.getValue("resolution")) {
        case true: return filterValue.includes("Yes");
        case false: return filterValue.includes("No");
        case null: return filterValue.includes("?");
      }
    }
  },
]

interface ActionDropdownProps {
  propId: number;
  resolution: boolean | null;
}

function ActionDropdown({ propId, resolution }: ActionDropdownProps) {
  const actions = resolution !== null ? [{
    'label': 'Unresolve',
    'onClick': async () => { unresolveProp({ propId }) },
  }] : [
    {
      label: 'Resolve to Yes',
      onClick: async () => { resolveProp({ propId, resolution: true }) },
    },
    {
      label: 'Resolve to No',
      onClick: async () => { resolveProp({ propId, resolution: false }) },
    },
  ]
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {actions.map(({ label, onClick }, i) => (
            <DropdownMenuItem key={i} onClick={onClick}>
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}