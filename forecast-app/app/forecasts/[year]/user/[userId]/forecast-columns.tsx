"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Edit } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RecordForecastForm } from "@/components/forms/record-forecast-form";
import { Forecast, VProp } from "@/types/db_types";
import { useState } from "react";

export type ScoredForecast = {
  category_id: number;
  category_name: string;
  prop_id: number;
  prop_text: string;
  prop_notes: string | null;
  resolution: boolean | null;
  user_id: number;
  forecast: number;
  forecast_id: number;
  penalty: number | null;
  year: number;
};

export function useForecastColumns(
  {editable, scored}: {editable: boolean, scored: boolean}
): ColumnDef<ScoredForecast>[] {
  const columns: ColumnDef<ScoredForecast>[] = [
    {
      accessorKey: "category_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="px-1 py-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Category
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "prop_text",
      header: "Proposition",
    },
    {
      accessorKey: "resolution",
      header: "Res",
      filterFn: (row, columnId, filterValue) => {
        if (filterValue.length === 3 || filterValue.length === 0) return true;
        switch (row.getValue("resolution")) {
          case true:
            return filterValue.includes("Yes");
          case false:
            return filterValue.includes("No");
          case null:
            return filterValue.includes("?");
        }
      },
      cell: ({ row }) => {
        const resolution = row.original.resolution;
        return (
          <div className="text-right">
            {resolution === null ? "?" : resolution ? 1 : 0}
          </div>
        );
      },
    },
    {
      accessorKey: "forecast",
      header: "Fcast",
      cell: ({ row }) => {
        return <div className="text-right">{row.original.forecast}</div>;
      },
    },
  ];
  // Editable tables have an edit button but no score column.
  if (editable) {
    columns.push({
      accessorKey: "edit",
      header: "Edit",
      cell: ({ row }) => <EditCell row={row} />,
    });
  }
  if (scored) {
    columns.push(
      {
        accessorKey: "score",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              className="px-1 py-0"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Score
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const penalty = row.original.penalty;
          const expression = `(${
            row.original.resolution ? 1 : 0
          } - ${row.original.forecast})`;
          const exprSpan = (
            <span>
              {expression}
              <sup>2</sup>
            </span>
          );
          return (
            <div className="text-right px-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    {penalty && penalty.toFixed(2)}
                  </TooltipTrigger>
                  <TooltipContent>{penalty && exprSpan}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        },
      },
    );
  }
  return columns;
}

function EditCell({ row }: { row: Row<ScoredForecast> }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const forecast: Forecast = {
    id: row.original.forecast_id,
    prop_id: row.original.prop_id,
    user_id: row.original.user_id,
    forecast: row.original.forecast,
  };
  const prop: VProp = {
    prop_id: row.original.prop_id,
    prop_text: row.original.prop_text,
    prop_notes: row.original.prop_notes,
    category_id: row.original.category_id,
    category_name: row.original.category_name,
    year: row.original.year,
    resolution: row.original.resolution,
  };
  return (
    <div className="text-right">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost">
            <Edit />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Forecast</DialogTitle>
          </DialogHeader>
          <RecordForecastForm prop={prop} initialForecast={forecast} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
