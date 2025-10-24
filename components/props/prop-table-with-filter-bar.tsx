"use client";

import { useState, useMemo } from "react";
import { VProp } from "@/types/db_types";
import { PropCard } from "@/components/prop-card";
import { FilterBar } from "./filter-bar";
import CreateNewPropButton from "@/components/tables/prop-table/create-new-prop-button";

type PropWithUserForecast = VProp & {
  user_forecast: number | null;
  user_forecast_id: number | null;
};

interface PropTableWithFilterBarProps {
  props: PropWithUserForecast[];
  canEditProps?: boolean;
  canEditResolutions?: boolean;
  canCreateProps?: boolean;
  competitionId?: number | null;
  defaultUserId?: number;
}

export function PropTableWithFilterBar({
  props,
  canEditProps = false,
  canEditResolutions = false,
  canCreateProps = false,
  competitionId,
  defaultUserId,
}: PropTableWithFilterBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedResolution, setSelectedResolution] = useState<string>("all");

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

      // Resolution filter
      const matchesResolution =
        selectedResolution === "all" ||
        (selectedResolution === "resolved" && prop.resolution !== null) ||
        (selectedResolution === "unresolved" && prop.resolution === null);

      return matchesSearch && matchesCategory && matchesResolution;
    });
  }, [props, searchQuery, selectedCategory, selectedResolution]);

  return (
    <div className="w-full">
      {/* Filter Bar */}
      <FilterBar
        props={props}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedResolution={selectedResolution}
        onResolutionChange={setSelectedResolution}
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
              <PropCard
                key={prop.prop_id}
                prop={prop}
                userForecast={prop.user_forecast ?? undefined}
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
