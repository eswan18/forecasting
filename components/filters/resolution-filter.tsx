"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ResolutionFilterValue = "all" | "resolved" | "unresolved";

interface ResolutionFilterProps {
  selectedResolution: ResolutionFilterValue;
  onResolutionChange: (resolution: ResolutionFilterValue) => void;
  className?: string;
}

export function ResolutionFilter({
  selectedResolution,
  onResolutionChange,
  className,
}: ResolutionFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getButtonText = () => {
    switch (selectedResolution) {
      case "resolved":
        return "Resolved";
      case "unresolved":
        return "Unresolved";
      default:
        return "All Resolutions";
    }
  };

  const hasActiveFilters = selectedResolution !== "all";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 text-xs sm:h-9 sm:text-sm justify-between w-full sm:min-w-[140px] sm:w-auto",
            hasActiveFilters && "border-primary bg-primary/5",
            className,
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="truncate">{getButtonText()}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="start">
        <DropdownMenuLabel>Filter by Resolution</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={selectedResolution}
          onValueChange={(value) =>
            onResolutionChange(value as ResolutionFilterValue)
          }
        >
          <DropdownMenuRadioItem value="all">
            All Resolutions
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="resolved">
            Resolved
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="unresolved">
            Unresolved
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
