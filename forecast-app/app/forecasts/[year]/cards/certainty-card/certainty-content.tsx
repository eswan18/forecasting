"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

export interface AvgCertaintyForUser {
  userId: number;
  userName: string;
  avgCertainty: number;
}

export default function CertaintyContent(
  { certainties }: { certainties: AvgCertaintyForUser[] },
) {
  const [reversed, setReversed] = useState(false);
  // Sort by most certain to least certain.
  if (reversed) {
    certainties.sort((a, b) => a.avgCertainty - b.avgCertainty);
  } else {
    certainties.sort((a, b) => b.avgCertainty - a.avgCertainty);
  }
  return (
    <>
      <div className="flex justify-end">
        <Toggle size="sm" pressed={reversed} onPressedChange={setReversed}>
          Reverse<ArrowUpDown />
        </Toggle>
      </div>
      <Table className="mt-1">
        <TableCaption className="text-xs">
          Certainty is computed as the distance from 0.5
        </TableCaption>
        <ScrollArea className="h-56 px-1" type="auto">
          <TableBody>
            {certainties.map(({ userId, userName, avgCertainty }) => (
              <TableRow key={userId} className="odd:bg-background">
                <TableCell className="text-muted-foreground text-xs">
                  {userName}
                </TableCell>
                <TableCell className="text-right text-xs">
                  {avgCertainty.toFixed(3)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ScrollArea>
      </Table>
    </>
  );
}
