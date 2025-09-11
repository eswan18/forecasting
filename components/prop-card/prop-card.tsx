import { useState } from "react";
import { VProp } from "@/types/db_types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CategoryBadge, ResolutionBadge } from "@/components/badges";
import { ResolutionDialog } from "@/components/dialogs/resolution-dialog";
import { PropEditDialog } from "@/components/dialogs/prop-edit-dialog";
import { Edit2 } from "lucide-react";

interface PropCardProps {
  prop: VProp;
  onCategoryClick?: (categoryName: string) => void;
  onResolutionClick?: (resolution: "resolved" | "unresolved") => void;
  allowEdits?: boolean;
}

export function PropCard({
  prop,
  onCategoryClick,
  onResolutionClick,
  allowEdits = false,
}: PropCardProps) {
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
  const [isPropEditDialogOpen, setIsPropEditDialogOpen] = useState(false);

  return (
    <Card>
      <CardContent className="py-4 px-6">
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-6">
            <div className="flex items-start gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm leading-relaxed font-medium flex-1">
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
              {allowEdits && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  onClick={() => setIsPropEditDialogOpen(true)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <div className="col-span-3">
            <CategoryBadge
              categoryName={prop.category_name}
              onClick={
                prop.category_name
                  ? () => onCategoryClick?.(prop.category_name!)
                  : undefined
              }
            />
          </div>
          <div className="col-span-3 flex justify-end items-start gap-2">
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
                    <p className="text-xs opacity-90">
                      <span className="font-medium">Notes:</span>{" "}
                      {prop.resolution_notes}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
            {allowEdits && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={() => setIsResolutionDialogOpen(true)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
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
