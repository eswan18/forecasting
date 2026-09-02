"use client";

import { useState } from "react";
import { PropWithUserForecast } from "@/types/db_types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown";
import { ForecastNeedle } from "@/components/ui/forecast-needle";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createForecast, updateForecast } from "@/lib/db_actions";
import { useServerAction } from "@/hooks/use-server-action";
import { PropEditDialog } from "@/components/dialogs/prop-edit-dialog";
import { Spinner } from "@/components/ui/spinner";
import { isChoiceKind } from "@/lib/prop-kind";
import { cn, focusRing } from "@/lib/utils";
import { EditableChoiceForecastCard } from "./editable-choice-forecast-card";
import { PercentInput } from "./percent-input";

interface EditableForecastCardProps {
  prop: PropWithUserForecast;
  onForecastUpdate?: () => void;
}

/**
 * A forecastable prop card. Binary props get the needle and a single % box;
 * choice props get a row-per-option editor. The two kinds keep their state in
 * different shapes, so they are separate components rather than one body full
 * of branches — this dispatcher holds no state of its own.
 */
export function EditableForecastCard({
  prop,
  onForecastUpdate,
}: EditableForecastCardProps) {
  if (isChoiceKind(prop.prop_kind)) {
    return (
      <EditableChoiceForecastCard
        prop={prop}
        onForecastUpdate={onForecastUpdate}
      />
    );
  }
  return (
    <EditableBinaryForecastCard prop={prop} onForecastUpdate={onForecastUpdate} />
  );
}

function EditableBinaryForecastCard({
  prop,
  onForecastUpdate,
}: EditableForecastCardProps) {
  const { user } = useCurrentUser();
  const [localForecast, setLocalForecast] = useState<number | null>(
    prop.user_forecast,
  );
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
  const baseline = prop.community_average ?? undefined;

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
      className={cn(
        "rounded-lg border bg-card p-5 transition-all",
        hasChanges
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-border hover:border-muted-foreground/30",
      )}
    >
      <div className="flex items-stretch gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2.5 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-medium">
              {prop.category_name}
            </Badge>
          </div>

          <div className="flex w-fit items-center gap-5">
            <div className="min-w-0">
              <h3 className="font-medium leading-snug text-foreground">
                <MarkdownRenderer>{prop.prop_text}</MarkdownRenderer>
              </h3>
              <p className="text-sm text-muted-foreground">
                {prop.prop_notes || " "}
              </p>
            </div>
            {user?.is_admin && (
              <button
                type="button"
                onClick={() => setIsEditDialogOpen(true)}
                aria-label="Edit prop"
                className={cn(
                  "shrink-0 rounded-sm text-muted-foreground hover:text-foreground",
                  focusRing,
                )}
              >
                <Pencil className="h-5 w-5" />
              </button>
            )}
          </div>

          {hasChanges && (
            <div className="mt-3 flex items-center gap-2">
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

        {/* Forecast needle (with community-average ghost) + number entry */}
        <div className="flex w-[150px] shrink-0 flex-col items-center justify-center gap-1.5">
          {localForecast != null ? (
            <>
              <ForecastNeedle
                forecast={localForecast}
                baseline={baseline}
                size="sm"
                showAxisLabels={false}
              />
              <PercentInput value={localForecast} onChange={setLocalForecast} />
              {baseline != null && (
                <div className="text-xs text-muted-foreground">
                  Average: {Math.round(baseline * 100)}%
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                No forecast yet
              </div>
              <PercentInput value={null} onChange={setLocalForecast} />
            </>
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
