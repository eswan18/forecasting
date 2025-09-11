import { VProp } from "@/types/db_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryBadge, ResolutionBadge } from "@/components/badges";
import { Edit2 } from "lucide-react";

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
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <CardTitle className="text-base leading-relaxed flex-1">
            {prop.prop_text}
          </CardTitle>
          {allowEdits && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        {prop.prop_notes && (
          <p className="text-sm text-muted-foreground">{prop.prop_notes}</p>
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
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {prop.resolution_notes && (
          <div className="w-full mt-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Resolution notes:</span>{" "}
              {prop.resolution_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
