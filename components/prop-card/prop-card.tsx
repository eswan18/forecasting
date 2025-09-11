import { VProp } from "@/types/db_types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CategoryBadge, ResolutionBadge } from "@/components/badges";

interface PropCardProps {
  prop: VProp;
}

export function PropCard({ prop }: PropCardProps) {
  return (
    <Card>
      <CardContent className="py-4 px-6">
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm leading-relaxed font-medium">
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
          </div>
          <div className="col-span-3">
            <CategoryBadge categoryName={prop.category_name} />
          </div>
          <div className="col-span-3 flex justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ResolutionBadge resolution={prop.resolution} />
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
