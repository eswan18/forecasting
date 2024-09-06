'use client';

import { MoreHorizontal } from "lucide-react";
import { PropAndResolution, resolveProp } from "@/lib/db_actions";
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
  DropdownMenuSeparator,
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
            <TableCell className="text-center">{!row.resolution && <ActionDropdown propId={row.prop_id} />}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ActionDropdown({ propId }: { propId: number }) {
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
          <DropdownMenuItem
            onClick={async () => { resolveProp({ propId, resolution: true }) }}
          >
            Resolve to Yes
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => { resolveProp({ propId, resolution: false }) }}
          >
            Resolve to No
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}