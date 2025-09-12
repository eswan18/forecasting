"use client";

import { CategoryFilter } from "./category-filter";
import { ResolutionFilter, ResolutionFilterValue } from "./resolution-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface FiltersContainerProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedResolution: ResolutionFilterValue;
  onResolutionChange: (resolution: ResolutionFilterValue) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  onClearFilters: () => void;
  className?: string;
}

export function FiltersContainer({
  categories,
  selectedCategories,
  onCategoryChange,
  selectedResolution,
  onResolutionChange,
  searchText,
  onSearchChange,
  onClearFilters,
  className,
}: FiltersContainerProps) {
  const hasActiveFilters =
    (selectedCategories.length > 0 &&
      selectedCategories.length < categories.length) ||
    selectedResolution !== "all" ||
    searchText !== "";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border",
        "sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {/* Filters - left aligned */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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

      {/* Search and Clear - right aligned on desktop, full width on mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder="Search propositions..."
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-full sm:w-64 h-8 text-xs sm:h-9 sm:text-sm"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 px-2 text-xs sm:h-8 sm:text-sm text-muted-foreground hover:text-foreground self-start sm:self-auto"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
