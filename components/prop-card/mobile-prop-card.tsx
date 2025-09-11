import { VProp } from "@/types/db_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge, ResolutionBadge } from "@/components/badges";

interface MobilePropCardProps {
  prop: VProp;
  onCategoryClick?: (categoryName: string) => void;
  onResolutionClick?: (resolution: "resolved" | "unresolved") => void;
}

export function MobilePropCard({
  prop,
  onCategoryClick,
  onResolutionClick,
}: MobilePropCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base leading-relaxed">
          {prop.prop_text}
        </CardTitle>
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
