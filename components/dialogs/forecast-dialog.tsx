"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecordForecastForm } from "@/components/forms/record-forecast-form";
import { VProp, Forecast } from "@/types/db_types";

interface ForecastDialogProps {
  prop: VProp;
  initialForecast?: Forecast | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ForecastDialog({
  prop,
  initialForecast,
  isOpen,
  onClose,
}: ForecastDialogProps) {
  const title = initialForecast ? "Update Forecast" : "Add Forecast";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <RecordForecastForm
          prop={prop}
          initialForecast={initialForecast || undefined}
          onSuccess={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
