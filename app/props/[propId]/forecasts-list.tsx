"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VForecast } from "@/types/db_types";

type SortOrder = "asc" | "desc";

interface ForecastsListProps {
  forecasts: VForecast[];
}

export default function ForecastsList({ forecasts }: ForecastsListProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Sort forecasts based on current sort order
  const sortedForecasts = [...forecasts].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.forecast - b.forecast;
    } else {
      return b.forecast - a.forecast;
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Forecasts ({forecasts.length})</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          >
            {sortOrder === "desc" ? (
              <ArrowDown className="h-4 w-4 mr-2" />
            ) : (
              <ArrowUp className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">
              Sort: {sortOrder === "desc" ? "High to Low" : "Low to High"}
            </span>
            <span className="sm:hidden">
              {sortOrder === "desc" ? "Desc" : "Asc"}
            </span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {forecasts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No forecasts have been made for this prop yet.
          </p>
        ) : (
          <div className="space-y-3">
            {sortedForecasts.map((forecast) => (
              <div
                key={forecast.forecast_id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex-1">
                  <p className="font-medium">{forecast.user_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg">
                    {(forecast.forecast * 100).toFixed(1)}%
                  </p>
                  {forecast.score !== null && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">
                        <span className="hidden sm:inline">Penalty score:</span>
                        <span className="sm:hidden">Penalty:</span>
                      </span>{" "}
                      <span className="font-mono">
                        {forecast.score.toFixed(4)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
