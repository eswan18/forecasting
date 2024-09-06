'use client';

import { MoreHorizontal } from "lucide-react";
import { PropAndResolution, resolveProp, unresolveProp } from "@/lib/db_actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export default function PropTable({ rows }: { rows: PropAndResolution[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-80">Proposition</TableHead>
          <TableHead className="text-center">Resolution</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.prop_id}>
            <TableCell className="font-medium">{row.prop_text}</TableCell>
            <TableCell className="text-center">{
              row.resolution === null ? '?'
                : row.resolution ? 'Yes' : 'No'
            }</TableCell>
            <TableCell className="text-center"><ActionDropdown propId={row.prop_id} resolution={row.resolution} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

interface ActionDropdownProps {
  propId: number;
  resolution: boolean | null;
}

function ActionDropdown({ propId, resolution }: ActionDropdownProps) {
  const actions = !!resolution ? [{
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
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
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