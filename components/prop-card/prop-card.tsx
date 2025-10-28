import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { VProp } from "@/types/db_types";

interface PropCardProps {
  prop: VProp;
  userForecast?: number;
}

export function PropCard({ prop, userForecast }: PropCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 w-full lg:max-w-4xl">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3 mb-4">
          <Badge
            variant="secondary"
            className="text-xs font-medium -translate-x-1"
          >
            {prop.category_name}
          </Badge>
          <Link href={`/props/${prop.prop_id}`}>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
        <h3 className="text-lg font-semibold leading-tight text-balance mb-0 wrap-anywhere">
          {prop.prop_text}
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {prop.prop_notes && (
          <p className="text-sm text-muted-foreground leading-relaxed wrap-anywhere">
            {prop.prop_notes}
          </p>
        )}

        <div className="flex w-full justify-end pt-2 border-t">
          <div className="flex flex-col gap-1 items-end w-36">
            <span className="text-xs text-muted-foreground font-medium">
              Your forecast
            </span>
            {userForecast !== undefined ? (
              <span className="text-2xl font-bold text-foreground">
                {userForecast.toFixed(2)}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">None</span>
            )}
          </div>
          <div className="flex flex-col gap-1 items-end w-36">
            <span className="text-xs text-muted-foreground font-medium">
              Resolution
            </span>
            {prop.resolution === true ? (
              <span className="text-2xl font-bold text-foreground">True</span>
            ) : prop.resolution === false ? (
              <span className="text-2xl font-bold text-foreground">False</span>
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">
                None
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
