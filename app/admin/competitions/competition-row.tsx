"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Refusal } from "@/components/form-sheet/form-sheet";
import { CreateEditCompetitionForm } from "@/components/forms/create-edit-competition-form";
import { LocalDate } from "@/components/local-date";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useServerAction } from "@/hooks/use-server-action";
import { getCompetitionStatusFromObject } from "@/lib/competition-status";
import { deleteCompetition } from "@/lib/db_actions";
import { formatDateTime } from "@/lib/time-utils";
import { Competition } from "@/types/db_types";

import { CompetitionStatusBadge } from "./competition-status-badge";

/**
 * One competition in the admin table.
 *
 * The row hands its cells straight to the page's grid (`display: contents`), so
 * the columns belong to the page and not to each row; the CSS for all of it
 * lives beside that grid in `page.tsx`. The two icon buttons this replaced —
 * one to open the competition, one to edit it — are the row menu's items, and
 * the name goes where the public list's names go, to the overview.
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const timezone = getBrowserTimezone();
  const router = useRouter();

  // A competition with props cannot be deleted — the server refuses, because
  // the props and every forecast against them would go with it — so the
  // confirmation says so instead of offering a button that will fail.
  const deletable = nProps === 0;

  const remove = useServerAction(deleteCompetition, {
    successMessage: "Competition deleted",
    onSuccess: () => {
      setConfirmingDelete(false);
      router.refresh();
    },
  });

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
        <span className="menucell">
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
              <DropdownMenuItem
                className="danger"
                onClick={() => setConfirmingDelete(true)}
              >
                Delete competition
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit competition</DialogTitle>
          </DialogHeader>
          <CreateEditCompetitionForm
            initialCompetition={competition}
            onSubmit={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmingDelete}
        onOpenChange={(next) => !remove.isLoading && setConfirmingDelete(next)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {competition.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletable
                ? "It holds no props, so nothing else goes with it except its membership list. This cannot be undone."
                : `It still holds ${nProps} ${
                    nProps === 1 ? "prop" : "props"
                  }. Delete or move ${
                    nProps === 1 ? "it" : "them"
                  } first — deleting the competition would take every forecast and score with it.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {remove.error && <Refusal message={remove.error} />}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isLoading}>
              {deletable ? "Cancel" : "Close"}
            </AlertDialogCancel>
            {deletable && (
              <AlertDialogAction
                className="danger"
                disabled={remove.isLoading}
                onClick={(e) => {
                  // Radix closes the dialog on action by default; the request
                  // has to finish first so a refusal has somewhere to show.
                  e.preventDefault();
                  remove.execute({ id: competition.id });
                }}
              >
                {remove.isLoading ? "Deleting…" : "Hard delete"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
