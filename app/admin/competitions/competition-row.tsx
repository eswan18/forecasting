"use client";

import { Competition } from "@/types/db_types";
import Link from "next/link";
import { Edit, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateEditCompetitionForm } from "@/components/forms/create-edit-competition-form";
import { useState } from "react";
import { formatDate, formatDateTime } from "@/lib/time-utils";
import { getBrowserTimezone } from "@/hooks/getBrowserTimezone";
import { CompetitionStatusBadge } from "./competition-status-badge";
import { getCompetitionStatusFromObject } from "@/lib/competition-status";

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

  return (
    <div className="flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold truncate">
              <Link
                href={`/competitions/${competition.id}/forecasts`}
                className="hover:text-primary transition-colors"
              >
                {competition.name}
              </Link>
            </h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/competitions/${competition.id}`}>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
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
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <CompetitionStatusBadge status={status} />
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    {status === "upcoming" &&
                      competition.forecasts_open_date && (
                        <>
                          Forecasts open{" "}
                          {formatDate(competition.forecasts_open_date, timezone)}
                        </>
                      )}
                    {status === "forecasts-open" &&
                      competition.forecasts_close_date && (
                        <>
                          Forecasts close{" "}
                          {formatDate(competition.forecasts_close_date, timezone)}
                        </>
                      )}
                    {status === "forecasts-closed" &&
                      competition.end_date && (
                        <>Ends {formatDate(competition.end_date, timezone)}</>
                      )}
                    {status === "ended" && competition.end_date && (
                      <>Ended {formatDate(competition.end_date, timezone)}</>
                    )}
                    {status === "private" && (
                      <>Uses per-prop deadlines</>
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {status === "private" ? (
                    <p>Private competition with per-prop deadlines</p>
                  ) : (
                    <div className="space-y-1">
                      {competition.forecasts_open_date && (
                        <p>
                          Forecasts Open:{" "}
                          {formatDateTime(competition.forecasts_open_date, timezone)}
                        </p>
                      )}
                      {competition.forecasts_close_date && (
                        <p>
                          Forecasts Close:{" "}
                          {formatDateTime(competition.forecasts_close_date, timezone)}
                        </p>
                      )}
                      {competition.end_date && (
                        <p>Ends: {formatDateTime(competition.end_date, timezone)}</p>
                      )}
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 ml-4">
        <div className="text-right">
          <div className="text-2xl font-bold">{nProps}</div>
          <div className="text-xs text-muted-foreground">total props</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{nResolvedProps}</div>
          <div className="text-xs text-muted-foreground">resolved</div>
        </div>
      </div>
    </div>
  );
}
