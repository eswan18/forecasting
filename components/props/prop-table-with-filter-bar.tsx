"use client";

import { useState, useMemo } from "react";
import { PropWithUserForecast } from "@/types/db_types";
import { ForecastCard } from "@/components/forecast-card";
import { FilterBar } from "./filter-bar";
import CreateNewPropButton from "@/components/tables/prop-table/create-new-prop-button";

interface PropTableWithFilterBarProps {
  props: PropWithUserForecast[];
  canCreateProps?: boolean;
  competitionId?: number | null;
  defaultUserId?: number;
  showCommunityAvg?: boolean;
}

export function PropTableWithFilterBar({
  props,
  canCreateProps = false,
  competitionId,
  defaultUserId,
  showCommunityAvg = false,
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

      <div className="space-y-4 max-w-3xl mx-auto">
        {filteredProps.length > 0 ? (
          <>
            {filteredProps.map((prop) => (
              <ForecastCard
                key={prop.prop_id}
                prop={prop}
                showCommunityAvg={showCommunityAvg}
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
