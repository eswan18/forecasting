"use client";
import { useState } from "react";
import { VForecast, VProp } from "@/types/db_types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CircleX, Edit, MoreHorizontal, Trash } from "lucide-react";
import { CreateEditPropForm } from "@/components/forms/create-edit-prop-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteForecast, deleteProp, deleteResolution } from "@/lib/db_actions";

export default function ForecastCardActionsButton({ record, userId }: {
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
          {isForecast(record)
            ? (
              <DropdownMenuItem onClick={() => setDialogStatus("clear-fcast")}>
                <CircleX size={14} className="mr-2" /> Clear Forecast
              </DropdownMenuItem>
            )
            : null}
          <DropdownMenuItem onClick={() => setDialogStatus("delete-prop")}>
            <Trash size={14} className="mr-2" /> Delete Prop
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
                <DeletePropDialogContents
                  record={record}
                  onSubmit={() => setDialogStatus(null)}
                />
              )
              : (isForecast(record)
                ? (
                  <ClearForecastDialogContents
                    record={record}
                    onSubmit={() => setDialogStatus(null)}
                  />
                )
                : null)
          )}
      </DialogContent>
    </Dialog>
  );
}

function ClearForecastDialogContents(
  { record, onSubmit }: { record: VForecast; onSubmit: () => void },
) {
  const handleClick = async () => {
    await deleteForecast({ id: record.forecast_id });
    onSubmit();
  };
  return (
    <>
      <DialogDescription>Are you sure?</DialogDescription>
      <DialogFooter>
        <Button variant="destructive" onClick={handleClick}>
          Clear Forecast
        </Button>
      </DialogFooter>
    </>
  );
}

function DeletePropDialogContents(
  { record, onSubmit }: { record: VForecast | VProp; onSubmit: () => void },
) {
  const description = isForecast(record)
    ? (
      record.resolution_id
        ? "This will also delete the forecast and resolution."
        : "This will also delete the forecast."
    )
    : (
      record.resolution_id
        ? "This will also delete the resolution."
        : "Are you sure?"
    );
  const handleClick = async () => {
    isForecast(record) && await deleteForecast({ id: record.forecast_id });
    record.resolution_id &&
      await deleteResolution({ id: record.resolution_id });
    await deleteProp({ id: record.prop_id });
    onSubmit();
  };
  return (
    <>
      <DialogDescription>{description}</DialogDescription>
      <DialogFooter>
        <Button variant="destructive" onClick={handleClick}>Delete Prop</Button>
      </DialogFooter>
    </>
  );
}

// A type guard to check if the record is a forecast or a prop
function isForecast(record: VForecast | VProp): record is VForecast {
  return (record as VForecast).forecast !== undefined;
}
