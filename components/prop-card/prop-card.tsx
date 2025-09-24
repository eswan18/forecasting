import { useState } from "react";
import { VProp } from "@/types/db_types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CategoryBadge, ResolutionBadge } from "@/components/badges";
import { ResolutionDialog } from "@/components/dialogs/resolution-dialog";
import { PropEditDialog } from "@/components/dialogs/prop-edit-dialog";
import { ForecastDialog } from "@/components/dialogs/forecast-dialog";
import { Edit2, ExternalLink, MoreVertical, ChevronDown } from "lucide-react";
import Link from "next/link";

interface PropCardProps {
  prop: VProp;
  userForecast?: number | null;
  userForecastId?: number | null;
  onCategoryClick?: (categoryName: string) => void;
  onResolutionClick?: (resolution: "resolved" | "unresolved") => void;
  canEditProps?: boolean;
  canEditResolutions?: boolean;
}

export function PropCard({
  prop,
  userForecast,
  userForecastId,
  onCategoryClick,
  onResolutionClick,
  canEditProps = false,
  canEditResolutions = false,
}: PropCardProps) {
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
  const [isPropEditDialogOpen, setIsPropEditDialogOpen] = useState(false);
  const [isForecastDialogOpen, setIsForecastDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardContent className="pt-4 pb-2 px-6">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center">
            <div className="flex justify-between col-span-3 mb-2">
              <div className="flex items-center gap-2">
                <CategoryBadge
                  categoryName={prop.category_name}
                  onClick={
                    prop.category_name
                      ? () => onCategoryClick?.(prop.category_name!)
                      : undefined
                  }
                />
                {(canEditProps || canEditResolutions) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {canEditProps && (
                        <DropdownMenuItem
                          onClick={() => setIsPropEditDialogOpen(true)}
                        >
                          <Edit2 className="h-3 w-3 mr-2" />
                          Edit Prop
                        </DropdownMenuItem>
                      )}
                      {canEditResolutions && (
                        <DropdownMenuItem
                          onClick={() => setIsResolutionDialogOpen(true)}
                        >
                          <Edit2 className="h-3 w-3 mr-2" />
                          Edit Resolution
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                asChild
              >
                <Link href={`/props/${prop.prop_id}`}>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            {/* second row */}
            <div className="flex items-start gap-2 min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm leading-relaxed font-medium flex-1 truncate min-w-0">
                    {prop.prop_text}
                  </p>
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <div className="space-y-1">
                    <p className="font-medium break-words">{prop.prop_text}</p>
                    {prop.prop_notes && (
                      <p className="text-xs text-primary-foreground/80 leading-relaxed break-words">
                        {prop.prop_notes}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="text-lg font-medium text-foreground text-center">
              {userForecast !== null && userForecast !== undefined ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="cursor-pointer hover:text-foreground/80"
                      onClick={() => setIsForecastDialogOpen(true)}
                    >
                      {userForecast.toFixed(2)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to edit forecast</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted/50"
                      onClick={() => setIsForecastDialogOpen(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add forecast</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <ResolutionBadge
                      resolution={prop.resolution}
                      onClick={() => {
                        if (prop.resolution === null) {
                          onResolutionClick?.("unresolved");
                        } else {
                          onResolutionClick?.("resolved");
                        }
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
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
                      <p className="text-xs text-primary-foreground/80 leading-relaxed break-words">
                        {prop.resolution_notes}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            {/* third row */}
            <div>{/* this space in the grid is empty. */}</div>
            <div className="text-xs text-muted-foreground text-center">
              Your Forecast
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Resolution
            </div>
          </div>

          {/* Expand/Collapse trigger */}
          <div className="flex justify-center">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-5 w-10 p-0 mb-1">
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="pt-4 border-t space-y-3">
              <p className="text-sm leading-relaxed break-words">
                <span className="text-muted-foreground">Prop: </span>
                {prop.prop_text}
              </p>
              <p className="text-sm leading-relaxed break-words">
                <span className="text-muted-foreground">Notes: </span>
                {prop.prop_notes}
              </p>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>

      <ResolutionDialog
        prop={prop}
        isOpen={isResolutionDialogOpen}
        onClose={() => setIsResolutionDialogOpen(false)}
      />

      <PropEditDialog
        prop={prop}
        isOpen={isPropEditDialogOpen}
        onClose={() => setIsPropEditDialogOpen(false)}
      />

      <ForecastDialog
        prop={prop}
        initialForecast={
          userForecast !== null && userForecast !== undefined && userForecastId
            ? {
                id: userForecastId,
                forecast: userForecast,
                prop_id: prop.prop_id,
                user_id: 0, // Will be set properly by the form
                created_at: new Date(), // Placeholder
                updated_at: new Date(), // Placeholder
              }
            : undefined
        }
        isOpen={isForecastDialogOpen}
        onClose={() => setIsForecastDialogOpen(false)}
      />
    </Card>
  );
}
