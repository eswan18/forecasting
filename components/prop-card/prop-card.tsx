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
import { CategoryBadge, ResolutionBadge } from "@/components/badges";
import { ResolutionDialog } from "@/components/dialogs/resolution-dialog";
import { PropEditDialog } from "@/components/dialogs/prop-edit-dialog";
import { Edit2, ExternalLink, MoreVertical } from "lucide-react";
import Link from "next/link";

interface PropCardProps {
  prop: VProp;
  userForecast?: number | null;
  onCategoryClick?: (categoryName: string) => void;
  onResolutionClick?: (resolution: "resolved" | "unresolved") => void;
  allowEdits?: boolean;
}

export function PropCard({
  prop,
  userForecast,
  onCategoryClick,
  onResolutionClick,
  allowEdits = false,
}: PropCardProps) {
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
  const [isPropEditDialogOpen, setIsPropEditDialogOpen] = useState(false);

  return (
    <Card>
      <CardContent className="py-4 px-6">
        <div className="grid grid-cols-[1fr_auto] gap-6 items-start">
          {/* Left side */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CategoryBadge
                categoryName={prop.category_name}
                onClick={
                  prop.category_name
                    ? () => onCategoryClick?.(prop.category_name!)
                    : undefined
                }
              />
              {allowEdits && (
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
                    <DropdownMenuItem
                      onClick={() => setIsPropEditDialogOpen(true)}
                    >
                      <Edit2 className="h-3 w-3 mr-2" />
                      Edit Prop
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsResolutionDialogOpen(true)}
                    >
                      <Edit2 className="h-3 w-3 mr-2" />
                      Edit Resolution
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="flex items-start gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm leading-relaxed font-medium flex-1 break-words">
                    {prop.prop_text}{" "}
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
                  </p>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <div className="space-y-1">
                    <p className="font-medium break-words">{prop.prop_text}</p>
                    {prop.prop_notes && (
                      <p className="text-xs text-muted-foreground/80 leading-relaxed break-words">
                        {prop.prop_notes}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center justify-center gap-4 h-full">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">
                Your Forecast
              </div>
              <div className="text-lg font-medium text-foreground">
                {userForecast !== null && userForecast !== undefined
                  ? `${Math.round(userForecast * 100)}%`
                  : "—"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">
                Resolution
              </div>
              <div className="flex items-center justify-end gap-2">
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
                        <p className="text-xs text-muted-foreground/80 leading-relaxed break-words">
                          {prop.resolution_notes}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

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
    </Card>
  );
}
