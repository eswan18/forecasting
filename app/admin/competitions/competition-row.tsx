"use client";

import { useState } from "react";
import Link from "next/link";

import { CreateEditCompetitionForm } from "@/components/forms/create-edit-competition-form";
import { LocalDate } from "@/components/local-date";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBrowserTimezone } from "@/hooks/getBrowserTimezone";
import { getCompetitionStatusFromObject } from "@/lib/competition-status";
import { formatDateTime } from "@/lib/time-utils";
import { Competition } from "@/types/db_types";

import { CompetitionStatusBadge } from "./competition-status-badge";

/**
 * One competition in the admin table.
 *
 * The row hands its cells straight to the page's grid (`display: contents`), so
 * the columns belong to the page and not to each row; the CSS for all of it
 * lives beside that grid in `page.tsx`. The two icon buttons this replaced —
 * one to open the competition, one to edit it — are the row menu's two items,
 * and the name goes where the public list's names go, to the overview.
 */
export default function CompetitionRow({
  competition,
  nProps,
  nResolvedProps,
}: {
  competition: Competition;
  nProps: number;
  nResolvedProps: number;
}) {
  const [open, setOpen] = useState(false);
  const timezone = getBrowserTimezone();

  const status = getCompetitionStatusFromObject(competition);

  // The dates to the minute, which the columns round to the day. This was a
  // tooltip on the one date the row printed; as a title it covers all three
  // and survives on a touch screen's long press.
  const schedule =
    [
      competition.forecasts_open_date &&
        `Forecasts open: ${formatDateTime(competition.forecasts_open_date, timezone)}`,
      competition.forecasts_close_date &&
        `Forecasts close: ${formatDateTime(competition.forecasts_close_date, timezone)}`,
      competition.end_date &&
        `Ends: ${formatDateTime(competition.end_date, timezone)}`,
    ]
      .filter(Boolean)
      .join("\n") || "Private competition with per-prop deadlines";

  return (
    <>
      <div className="comp">
        <span className="name">
          <Link href={`/competitions/${competition.id}`}>
            {competition.name}
          </Link>
          <CompetitionStatusBadge status={status} />
        </span>
        {/* suppressHydrationWarning: the title is written in the browser's
            timezone, so the server's UTC markup legitimately differs. */}
        <span className="cell due" title={schedule} suppressHydrationWarning>
          {competition.forecasts_close_date ? (
            <LocalDate date={competition.forecasts_close_date} />
          ) : competition.is_private ? (
            "Per-prop"
          ) : (
            <span className="none">—</span>
          )}
        </span>
        <span className="cell ends" title={schedule} suppressHydrationWarning>
          {competition.end_date ? (
            <LocalDate date={competition.end_date} />
          ) : (
            <span className="none">—</span>
          )}
        </span>
        <span className="cell n num">{nProps}</span>
        <span className="cell n num">{nResolvedProps}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="act"
              aria-label={`Manage ${competition.name}`}
            >
              ⋯
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setOpen(true)}>
              Edit competition
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              {/* /competitions/{id}/forecasts was deleted in 17135e5 and this
                  link has 404'd ever since; forecast-stats is where a
                  competition's forecasts are actually read now. */}
              <Link href={`/competitions/${competition.id}/forecast-stats`}>
                Forecast stats
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Competition</DialogTitle>
          </DialogHeader>
          <CreateEditCompetitionForm
            initialCompetition={competition}
            onSubmit={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
