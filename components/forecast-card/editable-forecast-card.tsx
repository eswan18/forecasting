"use client";

import { useState } from "react";
import { PropWithUserForecast } from "@/types/db_types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MarkdownRenderer } from "@/components/markdown";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createForecast, updateForecast } from "@/lib/db_actions";
import { useServerAction } from "@/hooks/use-server-action";
import { PropEditDialog } from "@/components/dialogs/prop-edit-dialog";
import { Spinner } from "@/components/ui/spinner";

interface EditableForecastCardProps {
  prop: PropWithUserForecast;
  onForecastUpdate?: () => void;
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
      bg: "bg-red-100",
      text: "text-red-700",
      bar: "bg-red-400",
      border: "border-red-400",
    };
  if (prob <= 0.4)
    return {
      bg: "bg-orange-100",
      text: "text-orange-700",
      bar: "bg-orange-400",
      border: "border-orange-400",
    };
  if (prob <= 0.6)
    return {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      bar: "bg-yellow-500",
      border: "border-yellow-500",
    };
  if (prob <= 0.8)
    return {
      bg: "bg-lime-100",
      text: "text-lime-700",
      bar: "bg-lime-500",
      border: "border-lime-500",
    };
  return {
    bg: "bg-green-100",
    text: "text-green-700",
    bar: "bg-green-500",
    border: "border-green-500",
  };
};

export function EditableForecastCard({
  prop,
  onForecastUpdate,
}: EditableForecastCardProps) {
  const { user } = useCurrentUser();
  const [localForecast, setLocalForecast] = useState<number | null>(
    prop.user_forecast,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const createForecastAction = useServerAction(createForecast, {
    successMessage: "Forecast recorded!",
    onSuccess: () => {
      onForecastUpdate?.();
    },
  });

  const updateForecastAction = useServerAction(updateForecast, {
    successMessage: "Forecast updated!",
    onSuccess: () => {
      onForecastUpdate?.();
    },
  });

  const isSubmitting =
    createForecastAction.isLoading || updateForecastAction.isLoading;

  const hasChanges = localForecast !== prop.user_forecast;
  const colors = getProbColor(localForecast);
  const percent =
    localForecast !== null ? Math.round(localForecast * 100) : null;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newValue = Math.max(0, Math.min(1, x / rect.width));
    setLocalForecast(Math.round(newValue * 100) / 100);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleBarClick(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
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
      className={`bg-card rounded-lg border p-5 transition-all ${
        hasChanges
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-border hover:border-muted-foreground/30"
      }`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex items-stretch gap-4">
        {/* Probability box */}
        <div
          className={`${colors.bg} ${colors.text} rounded-lg w-20 flex items-center justify-center shrink-0 transition-colors`}
        >
          <div className="text-2xl font-bold">
            {percent !== null ? `${percent}%` : "—"}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                {prop.category_name}
              </Badge>
            </div>
            {user?.is_admin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="h-7 px-2"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="font-medium text-foreground mb-3 leading-snug cursor-help">
                  <MarkdownRenderer>{prop.prop_text}</MarkdownRenderer>
                </h3>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm bg-popover text-popover-foreground border">
                <div className="space-y-2">
                  <p className="font-medium">{prop.prop_text}</p>
                  {prop.prop_notes && (
                    <p className="text-sm text-muted-foreground">
                      {prop.prop_notes}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Slider bar */}
          <div className="relative">
            <div
              className="h-3 bg-muted rounded-full relative cursor-pointer select-none"
              onMouseDown={handleMouseDown}
            >
              {/* Filled portion */}
              {percent !== null && (
                <div
                  className={`absolute h-3 rounded-full ${colors.bar} opacity-60 transition-all`}
                  style={{ width: `${percent}%` }}
                />
              )}

              {/* Draggable handle */}
              {percent !== null && (
                <div
                  className={`absolute top-1/2 w-5 h-5 bg-background border-2 ${colors.border} rounded-full shadow-md transition-transform ${
                    isDragging ? "scale-110" : "hover:scale-110"
                  }`}
                  style={{
                    left: `${percent}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              )}

              {/* Click hint for empty state */}
              {percent === null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    Click to set forecast
                  </span>
                </div>
              )}
            </div>

            {/* Scale labels */}
            <div className="flex justify-between text-xs text-muted-foreground/50 mt-1 px-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Action buttons when there are changes */}
          {hasChanges && (
            <div className="flex items-center gap-2 mt-3">
              <Button
                onClick={handleSave}
                disabled={isSubmitting || localForecast === null}
                size="sm"
                className="px-3"
              >
                {isSubmitting ? (
                  <Spinner className="h-3 w-3" />
                ) : (
                  "Save forecast"
                )}
              </Button>
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {user?.is_admin && (
        <PropEditDialog
          prop={prop}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            onForecastUpdate?.();
          }}
        />
      )}
    </div>
  );
}
