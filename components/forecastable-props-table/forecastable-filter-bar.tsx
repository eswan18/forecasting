"use client";

import { useMemo } from "react";
import { PropWithUserForecast } from "@/types/db_types";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ForecastableFilterBarProps {
  props: PropWithUserForecast[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedForecastStatus: string;
  onForecastStatusChange: (status: string) => void;
}

export function ForecastableFilterBar({
  props,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedForecastStatus,
  onForecastStatusChange,
}: ForecastableFilterBarProps) {
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
        <Select
          value={selectedCategory}
          onValueChange={onCategoryChange}
          key="category-select"
        >
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

        {/* Forecast Status Dropdown */}
        <Select
          value={selectedForecastStatus}
          onValueChange={onForecastStatusChange}
          key="forecast-status-select"
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Forecast Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="forecasted">Forecasted</SelectItem>
            <SelectItem value="unforecasted">Not Yet Forecasted</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
