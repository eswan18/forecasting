"use client";

import { cn } from "@/lib/utils";
import { VForecast, VProp } from "@/types/db_types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatInTimeZone } from "date-fns-tz";
import {
  Calendar,
  CircleX,
  Edit,
  Edit2,
  MoreHorizontal,
  Plus,
  Trash,
  TrendingUpDown,
} from "lucide-react";
import ResolutionSelectWidget from "@/components/resolution-select-widget";
import { resolveProp, unresolveProp } from "@/lib/db_actions";
import ForecastFieldForm from "./forecast-field-form";
import { EditPropButton } from "../tables/prop-table/edit-prop-button";
import { CreateEditPropForm } from "@/components/forms/create-edit-prop-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useState } from "react";

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
        <ActionsButton record={record} userId={userId} />
      </div>
      <CardHeader className="pt-0 flex-1">
        <h3 className="text-card-foreground">{record.prop_text}</h3>
        {/*<EditPropButton prop={record} />*/}
        <p className="text-muted-foreground text-xs">{record.prop_notes}</p>
      </CardHeader>
      <CardFooter className="flex-col pb-3 flex-none">
        <Separator className="mb-2" />
        <div className="w-full grid grid-cols-2 gap-y-1 sm:pl-3 sm:pr-2">
          <div className="flex flex-row gap-2 justify-start items-center">
            <TrendingUpDown className="text-muted-foreground" size={16} />
            <ForecastFieldForm
              userId={userId}
              propId={record.prop_id}
              initialForecast={isForecast(record) ? record : undefined}
            />
          </div>
          <div className="flex flex-row justify-end">
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

function ActionsButton({ record, userId }: {
  record: VForecast | VProp;
  userId: number;
}) {
  const [dialogStatus, setDialogStatus] = useState<
    "edit" | "delete-prop" | "clear-fcast" | null
  >(null);
  const dialogTitle = dialogStatus === "edit"
    ? "Edit Prop"
    : dialogStatus === "delete-prop"
    ? "Delete Prop"
    : dialogStatus === "clear-fcast"
    ? "Clear Forecast"
    : null;
  return (
    <Dialog
      open={dialogStatus !== null}
      onOpenChange={(open) =>
        setDialogStatus(open ? dialogStatus || "edit" : null)}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-7 w-10"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DialogTrigger asChild>
            <DropdownMenuItem onClick={() => setDialogStatus("edit")}>
              <Edit size={14} className="mr-2" /> Edit Prop
            </DropdownMenuItem>
          </DialogTrigger>
          <DropdownMenuItem onClick={() => setDialogStatus("delete-prop")}>
            <Trash size={14} className="mr-2" /> Delete Prop
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialogStatus("clear-fcast")}>
            <CircleX size={14} className="mr-2" /> Clear Forecast
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        {dialogStatus === "edit"
          ? (
            <CreateEditPropForm
              initialProp={record}
              defaultUserId={userId}
              onSubmit={() => setDialogStatus(null)}
            />
          )
          : (
            dialogStatus === "delete-prop"
              ? (
                <>
                  <DialogDescription>Are you sure? This will also delete the forecast and resolution.</DialogDescription>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={() => {/* delete logic */}}
                    >
                      Delete Prop & Forecast
                    </Button>
                  </DialogFooter>
                </>
              )
              : (
                <>
                  <DialogDescription>Are you sure?</DialogDescription>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={() => {/* delete logic */}}
                    >
                      Clear Forecast
                    </Button>
                  </DialogFooter>
                </>
              )
          )}
      </DialogContent>
    </Dialog>
  );
}
