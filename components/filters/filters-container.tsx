"use client";

import { CategoryFilter } from "./category-filter";
import { ResolutionFilter, ResolutionFilterValue } from "./resolution-filter";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FiltersContainerProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedResolution: ResolutionFilterValue;
  onResolutionChange: (resolution: ResolutionFilterValue) => void;
  onClearFilters: () => void;
  className?: string;
}

export function FiltersContainer({
  categories,
  selectedCategories,
  onCategoryChange,
  selectedResolution,
  onResolutionChange,
  onClearFilters,
  className,
}: FiltersContainerProps) {
  const hasActiveFilters = 
    (selectedCategories.length > 0 && selectedCategories.length < categories.length) ||
    selectedResolution !== "all";

  return (
    <div className={cn("flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <CategoryFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoryChange={onCategoryChange}
        />
        <ResolutionFilter
          selectedResolution={selectedResolution}
          onResolutionChange={onResolutionChange}
        />
      </div>
      
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
