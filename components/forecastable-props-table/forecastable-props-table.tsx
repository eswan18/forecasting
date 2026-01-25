"use client";

import { useState, useMemo } from "react";
import { PropWithUserForecast } from "@/types/db_types";
import { EditableForecastCard } from "@/components/forecast-card";
import { ForecastableFilterBar } from "./forecastable-filter-bar";
import CreateNewPropButton from "@/components/tables/prop-table/create-new-prop-button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ForecastablePropsTableProps {
  props: PropWithUserForecast[];
  canCreateProps?: boolean;
  competitionId?: number | null;
  defaultUserId?: number;
  onForecastUpdate?: () => void;
}

export function ForecastablePropsTable({
  props,
  canCreateProps = false,
  competitionId,
  defaultUserId,
  onForecastUpdate,
}: ForecastablePropsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedForecastStatus, setSelectedForecastStatus] =
    useState<string>("unforecasted");

  // Filter props
  const filteredProps = useMemo(() => {
    return props.filter((prop) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        prop.prop_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.prop_notes?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === "all" || prop.category_name === selectedCategory;

      // Forecast status filter
      const matchesForecastStatus =
        selectedForecastStatus === "all" ||
        (selectedForecastStatus === "forecasted" &&
          prop.user_forecast !== null) ||
        (selectedForecastStatus === "unforecasted" &&
          prop.user_forecast === null);

      return matchesSearch && matchesCategory && matchesForecastStatus;
    });
  }, [props, searchQuery, selectedCategory, selectedForecastStatus]);

  // Calculate progress for forecasts
  const completedForecasts = props.filter(
    (prop) => prop.user_forecast !== null,
  ).length;
  const totalProps = props.length;
  const remainingForecasts = totalProps - completedForecasts;
  const progressPercentage =
    totalProps > 0 ? (completedForecasts / totalProps) * 100 : 0;

  // Check if filters are in default state
  const isDefaultFilterState =
    selectedForecastStatus === "unforecasted" &&
    selectedCategory === "all" &&
    searchQuery === "";

  // Reset filters to default state
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedForecastStatus("unforecasted");
  };

  return (
    <div className="w-full">
      {/* Filter Bar */}
      <ForecastableFilterBar
        props={props}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedForecastStatus={selectedForecastStatus}
        onForecastStatusChange={setSelectedForecastStatus}
      />

      {/* Progress Card */}
      <Card className="w-full mb-6 mt-4">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-bold text-lg">Forecast Progress</h3>
            </div>
            <div className="font-bold text-primary text-lg">
              {completedForecasts}/{totalProps}
            </div>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-4">
            <div className="h-full flex">
              <div
                className="bg-primary transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
              <div
                className="bg-accent transition-all duration-300"
                style={{ width: `${100 - progressPercentage}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {remainingForecasts} remaining
            </p>
            {!isDefaultFilterState && (
              <Button variant="link" onClick={resetFilters}>
                Show all unforecasted
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results & New Prop Button */}
      <div className="flex items-center justify-between mt-4 mb-8 px-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredProps.length} of {props.length} propositions
        </p>
        {canCreateProps && (
          <CreateNewPropButton
            defaultCompetitionId={competitionId || null}
            defaultUserId={defaultUserId}
            iconOnly={false}
          />
        )}
      </div>

      <div className="space-y-4 max-w-3xl mx-auto">
        {filteredProps.length > 0 ? (
          <>
            {filteredProps.map((prop) => (
              <EditableForecastCard
                key={prop.prop_id}
                prop={prop}
                onForecastUpdate={onForecastUpdate}
              />
            ))}
          </>
        ) : (
          <div className="text-center py-12 bg-card border rounded-lg">
            <p className="text-muted-foreground">
              No propositions match your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
