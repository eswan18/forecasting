"use client";

import { useState, useMemo } from "react";
import { VProp } from "@/types/db_types";
import { ForecastablePropCard } from "@/components/forecastable-prop-card";
import { ForecastableFilterBar } from "./forecastable-filter-bar";
import CreateNewPropButton from "@/components/tables/prop-table/create-new-prop-button";

type PropWithUserForecast = VProp & {
  user_forecast: number | null;
  user_forecast_id: number | null;
};

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

      {/* Results & New Prop Button */}
      <div className="flex items-center justify-between mt-4 mb-8 px-8">
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

      <div className="space-y-3">
        {filteredProps.length > 0 ? (
          <div className="flex flex-col justify-start items-center gap-6">
            {filteredProps.map((prop) => (
              <ForecastablePropCard
                key={prop.prop_id}
                prop={prop}
                onForecastUpdate={onForecastUpdate}
              />
            ))}
          </div>
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
