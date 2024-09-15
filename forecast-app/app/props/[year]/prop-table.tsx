'use client';

import { PropAndResolution } from "@/lib/db_actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


/*export default function PropTable({ rows }: { rows: PropAndResolution[] }) {
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
}*/
