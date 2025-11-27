"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp } from "lucide-react";
import { PropWithUserForecast } from "@/types/db_types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createForecast, updateForecast } from "@/lib/db_actions";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { useServerAction } from "@/hooks/use-server-action";

interface ForecastablePropCardProps {
  prop: PropWithUserForecast;
  onForecastUpdate?: () => void;
}

export function ForecastablePropCard({
  prop,
  onForecastUpdate,
}: ForecastablePropCardProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [forecastValue, setForecastValue] = useState<string>(
    prop.user_forecast?.toString() ?? "",
  );

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

  const handleForecastSubmit = async () => {
    if (!user) return;

    const forecastNum = parseFloat(forecastValue);
    if (isNaN(forecastNum) || forecastNum < 0 || forecastNum > 1) {
      toast({
        title: "Invalid forecast",
        description: "Please enter a number between 0 and 1",
        variant: "destructive",
      });
      return;
    }

    if (prop.user_forecast_id) {
      // Update existing forecast
      await updateForecastAction.execute({
        id: prop.user_forecast_id,
        forecast: { forecast: forecastNum },
      });
    } else {
      // Create new forecast
      await createForecastAction.execute({
        forecast: {
          prop_id: prop.prop_id,
          user_id: user.id,
          forecast: forecastNum,
        },
      });
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 w-full lg:max-w-4xl">
      <CardHeader className="pb-2 grid grid-cols-[1fr_auto_auto] gap-x-4 w-full">
        {/* first row: the category badge */}
        <div className="col-span-3 flex flex-row justify-start">
          <Badge variant="secondary" className="w-fit -translate-x-1">
            {prop.category_name}
          </Badge>
        </div>

        {/* second row: just the label for the forecast */}
        <div></div>
        <div className="flex flex-row justify-end items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">
            Your forecast
          </span>
        </div>
        <div></div>

        {/* third row: the prop text */}
        <h3 className="text-lg font-semibold leading-tight text-balance mb-0 wrap-anywhere min-w-0">
          {prop.prop_text}
        </h3>
        <Input
          type="number"
          min={0}
          max={1}
          step="0.01"
          placeholder="0.50"
          value={forecastValue}
          onChange={(e) => setForecastValue(e.target.value)}
          className="h-8 text-sm w-full"
        />
        {/* using a constant width for the button keeps the grid layout stable regardless of the text content of the button */}
        <Button
          size="sm"
          onClick={handleForecastSubmit}
          disabled={isSubmitting}
          className="h-8 px-3 w-18"
        >
          {isSubmitting ? (
            <Spinner className="h-3 w-3" />
          ) : prop.user_forecast_id ? (
            "Update"
          ) : (
            "Save"
          )}
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {prop.prop_notes && (
          <p className="text-sm text-muted-foreground leading-relaxed wrap-anywhere">
            {prop.prop_notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
