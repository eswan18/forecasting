"use client";

import { useState, useMemo } from "react";
import { VProp } from "@/types/db_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CategoryBadge, ResolutionBadge } from "@/components/badges";
import { FiltersContainer, ResolutionFilterValue } from "@/components/filters";

interface PropCardProps {
  prop: VProp;
}

interface MobilePropCardProps {
  prop: VProp;
}

interface PropsTableProps {
  props: VProp[];
}

function PropCard({ prop }: PropCardProps) {
  return (
    <Card>
      <CardContent className="py-4 px-6">
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm leading-relaxed font-medium">
                  {prop.prop_text}
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <div className="space-y-1">
                  <p className="font-medium">{prop.prop_text}</p>
                  {prop.prop_notes && (
                    <p className="text-xs opacity-90">
                      <span className="font-medium">Notes:</span>{" "}
                      {prop.prop_notes}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="col-span-3">
            <CategoryBadge categoryName={prop.category_name} />
          </div>
          <div className="col-span-3 flex justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ResolutionBadge resolution={prop.resolution} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">
                    Resolution:{" "}
                    {prop.resolution === null
                      ? "Unresolved"
                      : prop.resolution
                        ? "True"
                        : "False"}
                  </p>
                  {prop.resolution_notes && (
                    <p className="text-xs opacity-90">
                      <span className="font-medium">Notes:</span>{" "}
                      {prop.resolution_notes}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MobilePropCard({ prop }: MobilePropCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base leading-relaxed">
          {prop.prop_text}
        </CardTitle>
        {prop.prop_notes && (
          <p className="text-sm text-muted-foreground">{prop.prop_notes}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge categoryName={prop.category_name} />
          </div>
          <ResolutionBadge resolution={prop.resolution} />
        </div>
        {prop.resolution_notes && (
          <div className="w-full mt-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Resolution notes:</span>{" "}
              {prop.resolution_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PropsTable({ props }: PropsTableProps) {
  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedResolution, setSelectedResolution] = useState<ResolutionFilterValue>("all");

  // Get unique categories from props
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(props.map((prop) => prop.category_name).filter((name): name is string => Boolean(name)))
    );
    return uniqueCategories.sort();
  }, [props]);

  // Filter props based on selected filters
  const filteredProps = useMemo(() => {
    return props.filter((prop) => {
      // Category filter
      const categoryMatch = 
        selectedCategories.length === 0 || 
        (prop.category_name && selectedCategories.includes(prop.category_name));

      // Resolution filter
      const resolutionMatch = 
        selectedResolution === "all" ||
        (selectedResolution === "resolved" && prop.resolution !== null) ||
        (selectedResolution === "unresolved" && prop.resolution === null);

      return categoryMatch && resolutionMatch;
    });
  }, [props, selectedCategories, selectedResolution]);

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedResolution("all");
  };

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
        {filteredProps.length !== props.length && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredProps.length} of {props.length} propositions
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="flex flex-col gap-2">
            {filteredProps.map((prop) => (
              <PropCard key={prop.prop_id} prop={prop} />
            ))}
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col gap-4">
          {filteredProps.map((prop) => (
            <MobilePropCard key={prop.prop_id} prop={prop} />
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
