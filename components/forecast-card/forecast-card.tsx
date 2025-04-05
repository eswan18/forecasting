"use client";

import { cn } from "@/lib/utils";
import { VForecast, VProp } from "@/types/db_types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Edit2, Plus, TrendingUpDown } from "lucide-react";
import ResolutionSelectWidget from "@/components/resolution-select-widget";
import { resolveProp, unresolveProp } from "@/lib/db_actions";
import ForecastFieldForm from "./forecast-field-form";

export default function ForecastCard(
  { record, userId, className }: {
    record: VProp | VForecast;
    userId: number;
    className?: string;
  },
) {
  const defaultClasses = "";
  className = cn(defaultClasses, className);
  return (
    <Card className={className}>
      <CardHeader>
        <h3 className="text-card-foreground">{record.prop_text}</h3>
        <p className="text-muted-foreground text-xs">{record.prop_notes}</p>
      </CardHeader>
      <CardContent>
        <Separator className="w-full mb-1" />
        <div className="w-full flex flex-row justify-between items-center">
          <div className="flex flex-row gap-2 items-center">
            <ForecastFieldForm
              userId={userId}
              propId={record.prop_id}
              initialForecast={isForecast(record) ? record : undefined}
            />
            <TrendingUpDown className="text-muted-foreground" size={16} />
          </div>
          <div className="flex flex-row gap-2 items-center">
            {isForecast(record)
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
        </div>
      </CardContent>
    </Card>
  );
}

// A type guard to check if the record is a forecast or a prop
function isForecast(record: VForecast | VProp): record is VForecast {
  return (record as VForecast).forecast !== undefined;
}
