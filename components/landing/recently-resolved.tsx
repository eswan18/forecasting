import { getRecentlyResolvedForecasts } from "@/lib/db_actions";
import { Card, CardContent } from "@/components/ui/card";
import ResolvedPropCard from "./resolved-prop-card";

interface RecentlyResolvedProps {
  userId: number;
  limit?: number;
}

export default async function RecentlyResolved({
  userId,
  limit = 3,
}: RecentlyResolvedProps) {
  const result = await getRecentlyResolvedForecasts({ userId, limit });

  if (!result.success) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            Unable to load recently resolved props.
          </p>
        </CardContent>
      </Card>
    );
  }

  const forecasts = result.data;

  if (forecasts.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            No resolved props yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {forecasts.map((forecast) => (
        <ResolvedPropCard
          key={forecast.forecast_id}
          propId={forecast.prop_id}
          propText={forecast.prop_text}
          propNotes={forecast.prop_notes}
          forecast={forecast.forecast}
          resolution={forecast.resolution!}
        />
      ))}
    </div>
  );
}
