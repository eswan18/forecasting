"use client";

import { Competition } from "@/types/db_types";
import Link from "next/link";
import { Edit, ExternalLink, Eye, EyeOff } from "lucide-react";
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
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateTime } from "@/lib/time-utils";
import { CompetitionStatusBadge } from "./competition-status-badge";
import { toggleCompetitionVisibility } from "@/lib/db_actions";

/**
 * Get the status of a competition based on current date
 * Returns "upcoming", "active", or "ended"
 */
function getCompetitionStatus(
  forecastsDueDate: Date,
  endDate: Date,
  currentDate: Date = new Date(),
): "upcoming" | "active" | "ended" {
  if (currentDate < forecastsDueDate) {
    return "upcoming";
  } else if (currentDate <= endDate) {
    return "active";
  } else {
    return "ended";
  }
}

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
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const status = getCompetitionStatus(
    competition.forecasts_due_date,
    competition.end_date,
  );

  const handleVisibilityToggle = async () => {
    const newVisibility = !competition.visible;
    startTransition(async () => {
      try {
        await toggleCompetitionVisibility({
          id: competition.id,
          visible: newVisibility,
        });
        toast({
          title: "Competition visibility updated",
          description: `Competition is now ${newVisibility ? "visible" : "hidden"} to users`,
        });
      } catch (error) {
        toast({
          title: "Failed to update visibility",
          description:
            error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      }
    });
  };

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
              <Link href={`/competitions/${competition.id}/props`}>
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleVisibilityToggle}
              disabled={isPending}
              title={
                competition.visible ? "Hide competition" : "Show competition"
              }
            >
              {competition.visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
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
                    Forecasts due {formatDate(competition.forecasts_due_date)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatDateTime(competition.forecasts_due_date)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span>•</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    Ends {formatDate(competition.end_date)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatDateTime(competition.end_date)}</p>
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
