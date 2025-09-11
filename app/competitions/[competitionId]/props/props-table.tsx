"use client";

import { VProp } from "@/types/db_types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FiltersContainer } from "@/components/filters";
import { PropCard, MobilePropCard } from "@/components/prop-card";
import { usePropsFilter } from "@/hooks/usePropsFilter";

interface PropsTableProps {
  props: VProp[];
}

export function PropsTable({ props }: PropsTableProps) {
  const {
    categories,
    selectedCategories,
    setSelectedCategories,
    selectedResolution,
    setSelectedResolution,
    filteredProps,
    handleClearFilters,
  } = usePropsFilter({ props });

  if (props.length === 0) {
    return (
      <div className="py-8">
        <p className="text-center text-muted-foreground">
          No propositions found for this competition.
        </p>
      </div>
    );
  }

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
          onClearFilters={handleClearFilters}
        />

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredProps.length} of {props.length} propositions
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="flex flex-col gap-2">
            {filteredProps.map((prop) => (
              <PropCard
                key={prop.prop_id}
                prop={prop}
                onCategoryClick={(categoryName) =>
                  setSelectedCategories([categoryName])
                }
                onResolutionClick={(resolution) =>
                  setSelectedResolution(resolution)
                }
              />
            ))}
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col gap-4">
          {filteredProps.map((prop) => (
            <MobilePropCard
              key={prop.prop_id}
              prop={prop}
              onCategoryClick={(categoryName) =>
                setSelectedCategories([categoryName])
              }
              onResolutionClick={(resolution) =>
                setSelectedResolution(resolution)
              }
            />
          ))}
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
