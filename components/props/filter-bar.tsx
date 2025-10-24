"use client";

import { useState, useMemo } from "react";
import { VProp } from "@/types/db_types";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PropWithUserForecast = VProp & {
  user_forecast: number | null;
  user_forecast_id: number | null;
};

interface FilterBarProps {
  props: PropWithUserForecast[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedResolution: string;
  onResolutionChange: (resolution: string) => void;
}

export function FilterBar({
  props,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedResolution,
  onResolutionChange,
}: FilterBarProps) {
  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(
      props
        .map((p) => p.category_name)
        .filter((name): name is string => Boolean(name)),
    );
    return Array.from(cats).sort();
  }, [props]);

  return (
    <div className="bg-transparent border rounded-lg p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search propositions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Dropdown */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Resolution Dropdown */}
        <Select value={selectedResolution} onValueChange={onResolutionChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Resolution" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
