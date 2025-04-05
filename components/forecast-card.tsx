import { cn } from "@/lib/utils";
import { VForecast, VProp } from "@/types/db_types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "./ui/separator";

export default function ForecastCard(
  { record, className }: { record: VProp | VForecast; className?: string },
) {
  const defaultClasses = "";
  className = cn(defaultClasses, className);
  return (
    <Card className={className}>
      <CardHeader>
        <h3 className="text-card-foreground">{record.prop_text}</h3>
        <p className="text-muted-foreground text-xs">{record.prop_notes}</p>
      </CardHeader>
      <CardContent>
        <Separator className="w-full" />
        ...
      </CardContent>
    </Card>
  );
}
