"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Calendar, CalendarClock, Lock } from "lucide-react";
import { PropWithUserForecast } from "@/types/db_types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/markdown";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserTimezone } from "@/hooks/useUserTimezone";
import { createForecast, updateForecast } from "@/lib/db_actions";
import { useServerAction } from "@/hooks/use-server-action";
import { Spinner } from "@/components/ui/spinner";
import { PropEditDialog } from "@/components/dialogs/prop-edit-dialog";
import { formatDateTime } from "@/lib/time-utils";

interface CompetitionPropViewProps {
  prop: PropWithUserForecast;
  competitionId: number;
  competitionName: string;
  isForecastingOpen: boolean;
  isAdmin: boolean;
}

// Helper to get color based on probability
const getProbColor = (prob: number | null) => {
  if (prob === null)
    return {
      bg: "bg-muted",
      text: "text-muted-foreground",
      bar: "bg-muted-foreground/30",
      border: "border-muted-foreground/30",
    };
  if (prob <= 0.2)
    return {
      bg: "bg-red-100 dark:bg-red-950",
      text: "text-red-700 dark:text-red-400",
      bar: "bg-red-400",
      border: "border-red-400",
    };
  if (prob <= 0.4)
    return {
      bg: "bg-orange-100 dark:bg-orange-950",
      text: "text-orange-700 dark:text-orange-400",
      bar: "bg-orange-400",
      border: "border-orange-400",
    };
  if (prob <= 0.6)
    return {
      bg: "bg-yellow-100 dark:bg-yellow-950",
      text: "text-yellow-700 dark:text-yellow-400",
      bar: "bg-yellow-500",
      border: "border-yellow-500",
    };
  if (prob <= 0.8)
    return {
      bg: "bg-lime-100 dark:bg-lime-950",
      text: "text-lime-700 dark:text-lime-400",
      bar: "bg-lime-500",
      border: "border-lime-500",
    };
  return {
    bg: "bg-green-100 dark:bg-green-950",
    text: "text-green-700 dark:text-green-400",
    bar: "bg-green-500",
    border: "border-green-500",
  };
};

function formatPropDate(date: Date | string | null, timezone: string): string {
  if (!date) return "No deadline";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDateTime(d, timezone);
}

function getRelativeDeadline(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Closed";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays <= 7) return `${diffDays} days left`;
  return null;
}

export function CompetitionPropView({
  prop,
  competitionId,
  competitionName,
  isForecastingOpen,
  isAdmin,
}: CompetitionPropViewProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const timezone = useUserTimezone();
  const [localForecast, setLocalForecast] = useState<number | null>(
    prop.user_forecast,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const createForecastAction = useServerAction(createForecast, {
    successMessage: "Forecast recorded!",
    onSuccess: () => {
      router.refresh();
    },
  });

  const updateForecastAction = useServerAction(updateForecast, {
    successMessage: "Forecast updated!",
    onSuccess: () => {
      router.refresh();
    },
  });

  const isSubmitting =
    createForecastAction.isLoading || updateForecastAction.isLoading;

  const hasChanges = localForecast !== prop.user_forecast;
  const colors = getProbColor(localForecast);
  const percent =
    localForecast !== null ? Math.round(localForecast * 100) : null;

  const relativeDeadline = getRelativeDeadline(prop.prop_forecasts_due_date);

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isForecastingOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newValue = Math.max(0, Math.min(1, x / rect.width));
    setLocalForecast(Math.round(newValue * 100) / 100);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isForecastingOpen) return;
    setIsDragging(true);
    handleBarClick(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !isForecastingOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newValue = Math.max(0, Math.min(1, x / rect.width));
    setLocalForecast(Math.round(newValue * 100) / 100);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    if (!user || localForecast === null) return;

    if (prop.user_forecast_id) {
      await updateForecastAction.execute({
        id: prop.user_forecast_id,
        forecast: { forecast: localForecast },
      });
    } else {
      await createForecastAction.execute({
        forecast: {
          prop_id: prop.prop_id,
          user_id: user.id,
          forecast: localForecast,
        },
      });
    }
  };

  const handleCancel = () => {
    setLocalForecast(prop.user_forecast);
  };

  return (
    <div
      className="min-h-screen bg-background"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header with breadcrumbs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link
              href="/competitions"
              className="hover:text-foreground transition-colors"
            >
              Competitions
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/competitions/${competitionId}`}
              className="hover:text-foreground transition-colors"
            >
              {competitionName}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Proposition</span>
          </nav>

          {/* Prop title */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {prop.category_name && (
                <Badge variant="secondary" className="mb-2">
                  {prop.category_name}
                </Badge>
              )}
              <h1 className="text-2xl font-bold text-foreground mb-2">
                <MarkdownRenderer>{prop.prop_text}</MarkdownRenderer>
              </h1>
              {prop.prop_notes && (
                <p className="text-muted-foreground">
                  <MarkdownRenderer>{prop.prop_notes}</MarkdownRenderer>
                </p>
              )}
            </div>
          </div>

          {/* Deadline info */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              <span>Forecasts due: {formatPropDate(prop.prop_forecasts_due_date, timezone)}</span>
              {relativeDeadline && (
                <Badge
                  variant={relativeDeadline === "Closed" ? "destructive" : "outline"}
                  className="ml-1"
                >
                  {relativeDeadline}
                </Badge>
              )}
            </div>
            {prop.prop_resolution_due_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Resolves: {formatPropDate(prop.prop_resolution_due_date, timezone)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Forecasting card */}
        <Card
          className={`mb-6 transition-all ${
            hasChanges && isForecastingOpen
              ? "border-blue-300 ring-2 ring-blue-100"
              : ""
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Your Forecast</h2>
              {!isForecastingOpen && (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Forecasting Closed
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-6 mb-6">
              {/* Probability display */}
              <div
                className={`${colors.bg} ${colors.text} rounded-xl w-28 h-24 flex flex-col items-center justify-center shrink-0 transition-colors`}
              >
                <div className="text-4xl font-bold">
                  {percent !== null ? `${percent}%` : "—"}
                </div>
                <div className="text-xs opacity-70">
                  {percent !== null ? "Your forecast" : "Not set"}
                </div>
              </div>

              {/* Slider */}
              <div className="flex-1">
                <div className="relative">
                  <div
                    className={`h-4 bg-muted rounded-full relative select-none ${
                      isForecastingOpen ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                    }`}
                    onMouseDown={handleMouseDown}
                  >
                    {/* Filled portion */}
                    {percent !== null && (
                      <div
                        className={`absolute h-4 rounded-full ${colors.bar} opacity-60 transition-all`}
                        style={{ width: `${percent}%` }}
                      />
                    )}

                    {/* Draggable handle */}
                    {percent !== null && (
                      <div
                        className={`absolute top-1/2 w-6 h-6 bg-background border-2 ${colors.border} rounded-full shadow-md transition-transform ${
                          isDragging ? "scale-110" : isForecastingOpen ? "hover:scale-110" : ""
                        }`}
                        style={{
                          left: `${percent}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    )}

                    {/* Click hint for empty state */}
                    {percent === null && isForecastingOpen && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">
                          Click or drag to set your forecast
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Scale labels */}
                  <div className="flex justify-between text-xs text-muted-foreground/50 mt-2 px-1">
                    <span>0% - Very unlikely</span>
                    <span>50%</span>
                    <span>100% - Very likely</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {isForecastingOpen && hasChanges && (
              <div className="flex items-center gap-3 pt-2 border-t">
                <Button
                  onClick={handleSave}
                  disabled={isSubmitting || localForecast === null}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Forecast"
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            )}

            {!isForecastingOpen && prop.user_forecast !== null && (
              <p className="text-sm text-muted-foreground pt-2 border-t">
                You submitted your forecast before the deadline.
              </p>
            )}

            {!isForecastingOpen && prop.user_forecast === null && (
              <p className="text-sm text-destructive pt-2 border-t">
                You did not submit a forecast before the deadline.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Back to competition button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => router.push(`/competitions/${competitionId}?tab=open`)}
          >
            Back to Competition
          </Button>
        </div>
      </div>

      {isAdmin && (
        <PropEditDialog
          prop={prop}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
