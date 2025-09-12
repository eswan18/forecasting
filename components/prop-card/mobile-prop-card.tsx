import { useState } from "react";
import { VProp } from "@/types/db_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryBadge, ResolutionBadge } from "@/components/badges";
import { ResolutionDialog } from "@/components/dialogs/resolution-dialog";
import { PropEditDialog } from "@/components/dialogs/prop-edit-dialog";
import { Edit2, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MobilePropCardProps {
  prop: VProp;
  onCategoryClick?: (categoryName: string) => void;
  onResolutionClick?: (resolution: "resolved" | "unresolved") => void;
  allowEdits?: boolean;
}

export function MobilePropCard({
  prop,
  onCategoryClick,
  onResolutionClick,
  allowEdits = false,
}: MobilePropCardProps) {
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
  const [isPropEditDialogOpen, setIsPropEditDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <CardTitle className="text-base leading-relaxed flex-1">
            {prop.prop_text}
          </CardTitle>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>
                <p>View all forecasts for this prop</p>
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
        {prop.prop_notes && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              {prop.prop_notes}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge
              categoryName={prop.category_name}
              onClick={
                prop.category_name
                  ? () => onCategoryClick?.(prop.category_name!)
                  : undefined
              }
            />
          </div>
          <div className="flex items-center gap-2">
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
        {prop.resolution_notes && (
          <div className="w-full mt-2 pt-2 border-t border-border/30">
            <p className="text-xs font-medium text-muted-foreground/70 mb-1">
              Resolution Notes
            </p>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
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
