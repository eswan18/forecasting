"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AvgCertaintyForUser {
  userId: number;
  userName: string;
  avgCertainty: number;
}

export default function CertaintyContent(
  { certainties }: { certainties: AvgCertaintyForUser[] },
) {
  // Sort by most certain to least certain.
  certainties.sort((a, b) => b.avgCertainty - a.avgCertainty);
  return (
    <Table>
      <TableCaption>Certainty is computed as the distance from 0.5</TableCaption>
      <ScrollArea className="h-56">
        <TableBody>
          {certainties.map(({ userId, userName, avgCertainty }) => (
            <TableRow key={userId}>
              <TableCell className="text-muted-foreground text-xs">
                {userName}
              </TableCell>
              <TableCell className="text-right">
                {avgCertainty.toFixed(3)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </ScrollArea>
    </Table>
  );
}
