"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Edit } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ScoredForecast = {
  category_name: string;
  prop_text: string;
  resolution: boolean | null;
  forecast: number;
  penalty: number | null;
};

export function useForecastColumns(
  editable: boolean,
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
        return (
          <div className="text-right">{row.original.forecast}</div>
        );
      },
    },
  ];
  // Editable tables have an edit button but no score column.
  if (editable) {
    columns.push({
      accessorKey: "edit",
      header: "Edit",
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <Button size="icon" variant="ghost">
              <Edit />
            </Button>
          </div>
        );
      },
    });
  } else {
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
