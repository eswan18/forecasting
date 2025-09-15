"use client";

import { VProp } from "@/types/db_types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FiltersContainer } from "@/components/filters";
import { PropCard, MobilePropCard } from "@/components/prop-card";
import { usePropsFilter } from "@/hooks/usePropsFilter";
import CreateNewPropButton from "@/components/tables/prop-table/create-new-prop-button";

type PropWithUserForecast = VProp & { user_forecast: number | null };

interface PropsTableProps {
  props: PropWithUserForecast[];
  canCreateProps?: boolean;
  canEditProps?: boolean;
  canEditResolutions?: boolean;
  competitionId?: number | null;
  defaultUserId?: number;
}

export function PropsTable({
  props,
  canCreateProps = false,
  canEditProps = false,
  canEditResolutions = false,
  competitionId,
  defaultUserId,
}: PropsTableProps) {
  const {
    categories,
    selectedCategories,
    setSelectedCategories,
    selectedResolution,
    setSelectedResolution,
    searchText,
    setSearchText,
    filteredProps,
    handleClearFilters,
  } = usePropsFilter({ props: props as VProp[] });

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Filters */}
        <FiltersContainer
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
          selectedResolution={selectedResolution}
          onResolutionChange={setSelectedResolution}
          searchText={searchText}
          onSearchChange={setSearchText}
          onClearFilters={handleClearFilters}
        />

        {/* Add New Prop Button */}
        {canCreateProps && (
          <div className="flex justify-end">
            <CreateNewPropButton
              defaultCompetitionId={competitionId || null}
              defaultUserId={defaultUserId}
            />
          </div>
        )}

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredProps.length} of {props.length} propositions
        </div>

        {/* No props message */}
        {props.length === 0 && (
          <div className="py-8">
            <p className="text-center text-muted-foreground">
              No propositions found for this competition.
            </p>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="flex flex-col gap-2">
            {filteredProps.map((prop) => {
              const propWithForecast = props.find(
                (p) => p.prop_id === prop.prop_id,
              ) as PropWithUserForecast;
              return (
                <PropCard
                  key={prop.prop_id}
                  prop={prop}
                  userForecast={propWithForecast?.user_forecast}
                  onCategoryClick={(categoryName) =>
                    setSelectedCategories([categoryName])
                  }
                  onResolutionClick={(resolution) =>
                    setSelectedResolution(resolution)
                  }
                  canEditProps={canEditProps}
                  canEditResolutions={canEditResolutions}
                />
              );
            })}
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col gap-4">
          {filteredProps.map((prop) => {
            const propWithForecast = props.find(
              (p) => p.prop_id === prop.prop_id,
            ) as PropWithUserForecast;
            return (
              <MobilePropCard
                key={prop.prop_id}
                prop={prop}
                userForecast={propWithForecast?.user_forecast}
                onCategoryClick={(categoryName) =>
                  setSelectedCategories([categoryName])
                }
                onResolutionClick={(resolution) =>
                  setSelectedResolution(resolution)
                }
                canEditProps={canEditProps}
                canEditResolutions={canEditResolutions}
              />
            );
          })}
        </div>

        {/* No results message */}
        {filteredProps.length === 0 && props.length > 0 && (
          <div className="py-8">
            <p className="text-center text-muted-foreground">
              No propositions match the current filters.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
