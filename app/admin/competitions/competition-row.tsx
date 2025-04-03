"use client";

import { Competition } from "@/types/db_types";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateEditCompetitionForm } from "@/components/forms/create-edit-competition-form";
import { useState } from "react";

export default function CompetitionRow(
  { competition, nProps }: { competition: Competition; nProps: number },
) {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid grid-cols-3 gap-4 p-4 border border-b-muted">
      <div className="col-span-2 text-lg font-semibold flex flex-row items-center justify-start gap-x-2">
        <Link href={`/competitions/${competition.id}/forecasts`}>
          {competition.name}
        </Link>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6">
              <Edit size={18} />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Edit Competition</DialogTitle>
            <CreateEditCompetitionForm
              initialCompetition={competition}
              onSubmit={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="text-right">
        <Link href={`/competitions/${competition.id}/props`}>
          <span className="font-semibold">{nProps}</span>{" "}
          <span className="text-muted-foreground">props</span>
        </Link>
      </div>
      <div className="text-sm col-span-2 flex flex-col items-start justify-start">
        <p>
          <span className="text-muted-foreground">from</span> {formatInTimeZone(
            competition.forecasts_due_date,
            "UTC",
            "yyyy-MM-dd HH:mm:ss 'UTC'",
          )}
        </p>
        <p>
          <span className="text-muted-foreground">to</span> {formatInTimeZone(
            competition.end_date,
            "UTC",
            "yyyy-MM-dd HH:mm:ss 'UTC'",
          )}
        </p>
      </div>
    </div>
  );
}
