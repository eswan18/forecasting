"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  className?: string;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onCategoryChange,
  className,
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryToggle = (category: string) => {
    const newSelected = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onCategoryChange(newSelected);
  };

  const handleSelectAll = () => {
    onCategoryChange(categories);
  };

  const handleSelectNone = () => {
    onCategoryChange([]);
  };

  const getButtonText = () => {
    if (selectedCategories.length === 0) {
      return "All Categories";
    }
    if (selectedCategories.length === categories.length) {
      return "All Categories";
    }
    if (selectedCategories.length === 1) {
      return selectedCategories[0];
    }
    return `${selectedCategories.length} Categories`;
  };

  const hasActiveFilters =
    selectedCategories.length > 0 &&
    selectedCategories.length < categories.length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-between min-w-[140px]",
            hasActiveFilters && "border-primary bg-primary/5",
            className,
          )}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="truncate">{getButtonText()}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={
            selectedCategories.length === 0 ||
            selectedCategories.length === categories.length
          }
          onCheckedChange={() => {
            if (
              selectedCategories.length === 0 ||
              selectedCategories.length === categories.length
            ) {
              handleSelectNone();
            } else {
              handleSelectAll();
            }
          }}
        >
          All Categories
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {categories.map((category) => (
          <DropdownMenuCheckboxItem
            key={category}
            checked={selectedCategories.includes(category)}
            onCheckedChange={() => handleCategoryToggle(category)}
          >
            {category}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
