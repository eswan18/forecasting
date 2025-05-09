"use client";

import { cn } from "@/lib/utils";
import { VForecast, VProp } from "@/types/db_types";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar, TrendingUpDown } from "lucide-react";
import ResolutionSelectWidget from "@/components/resolution-select-widget";
import { resolveProp, unresolveProp } from "@/lib/db_actions";
import ForecastFieldForm from "./forecast-field-form";
import ForecastCardActionsButton from "./forecast-card-actions-button";

export default function ForecastCard(
  { record, userId, className }: {
    record: VProp | VForecast;
    userId: number;
    className?: string;
  },
) {
  const defaultClasses = "min-h-48 flex flex-col justify-start";
  className = cn(defaultClasses, className);
  return (
    <Card className={className}>
      <div className="w-full flex flex-row justify-end flex-none">
        <ForecastCardActionsButton record={record} userId={userId} />
      </div>
      <CardHeader className="pt-0 flex-1">
        <h3 className="text-card-foreground">{record.prop_text}</h3>
        <p className="text-muted-foreground text-xs">{record.prop_notes}</p>
      </CardHeader>
      <CardFooter className="flex-col pb-3 flex-none h-18">
        <Separator className="mb-2" />
        <div className="w-full grid grid-cols-2 gap-y-1 sm:pl-3 sm:pr-2">
          <div className="flex flex-row gap-2 justify-start items-center">
            <TrendingUpDown className="text-muted-foreground" size={16} />
            <ForecastFieldForm
              userId={userId}
              propId={record.prop_id}
              initialForecast={isForecast(record) ? record : undefined}
              // Adding a key causes this to rerender when the forecast is deleted,
              // which clears the input field within.
              key={isForecast(record) ? record.forecast_id : undefined}
            />
          </div>
          <div className="flex flex-row justify-end">
            {isForecast(record) || record.resolution_id
              ? (
                <ResolutionSelectWidget
                  size="sm"
                  resolution={record.resolution ?? undefined}
                  setResolution={(resolution, notes) =>
                    resolution === undefined
                      ? unresolveProp({ propId: record.prop_id })
                      : resolveProp({
                        propId: record.prop_id,
                        resolution,
                        userId: userId,
                        overwrite: true,
                        notes,
                      })}
                />
              )
              : null}
          </div>
          {isForecast(record)
            ? (
              <>
                <div className="flex flex-row gap-1 justify-start items-center text-xs text-muted-foreground">
                  <Calendar size={10} /> {formatInTimeZone(
                    record.forecast_updated_at,
                    "UTC",
                    "yyyy-MM-dd",
                  )}
                </div>
                <div className="flex flex-row justify-end gap-1 items-center text-xs text-muted-foreground">
                  {record.resolution_updated_at !== null
                    ? (
                      <>
                        <Calendar size={10} /> {formatInTimeZone(
                          record.resolution_updated_at,
                          "UTC",
                          "yyyy-MM-dd",
                        )}
                      </>
                    )
                    : null}
                </div>
              </>
            )
            : null}
        </div>
      </CardFooter>
    </Card>
  );
}

// A type guard to check if the record is a forecast or a prop
function isForecast(record: VForecast | VProp): record is VForecast {
  return (record as VForecast).forecast !== undefined;
}
