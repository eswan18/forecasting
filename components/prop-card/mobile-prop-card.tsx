import { useState } from "react";
import { VProp } from "@/types/db_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MobilePropCardProps {
  prop: VProp;
  userForecast?: number | null;
  onCategoryClick?: (categoryName: string) => void;
  onResolutionClick?: (resolution: "resolved" | "unresolved") => void;
  canEditProps?: boolean;
  canEditResolutions?: boolean;
}

export function MobilePropCard({
  prop,
  userForecast,
  onCategoryClick,
  onResolutionClick,
  canEditProps = false,
  canEditResolutions = false,
}: MobilePropCardProps) {
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
  const [isPropEditDialogOpen, setIsPropEditDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                asChild
              >
                <Link href={`/props/${prop.prop_id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View all forecasts for this prop</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CardTitle className="text-base leading-relaxed mt-1 break-words">
          {prop.prop_text}
        </CardTitle>
        {prop.prop_notes && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <p className="text-sm text-muted-foreground/80 leading-relaxed break-words">
              {prop.prop_notes}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <div className="text-xs text-muted-foreground">Your Forecast</div>
          <div className="text-xs text-muted-foreground text-right">
            Resolution
          </div>
          <div className="text-lg font-medium text-foreground">
            {userForecast !== null && userForecast !== undefined
              ? `${Math.round(userForecast * 100)}%`
              : "—"}
          </div>
          <div className="flex items-center justify-end gap-2">
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
        </div>
        {prop.resolution_notes && (
          <div className="w-full mt-2 pt-2 border-t border-border/30">
            <p className="text-xs font-medium text-muted-foreground/70 mb-1">
              Resolution Notes
            </p>
            <p className="text-sm text-muted-foreground/80 leading-relaxed break-words">
              {prop.resolution_notes}
            </p>
          </div>
        )}
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
