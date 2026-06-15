import { getRecentlyResolvedForecasts } from "@/lib/db_actions";
import ResolvedPropCard from "./resolved-prop-card";

interface RecentlyResolvedProps {
  userId: number;
  limit?: number;
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export default async function RecentlyResolved({
  userId,
  limit = 3,
}: RecentlyResolvedProps) {
  const result = await getRecentlyResolvedForecasts({ userId, limit });

  if (!result.success) {
    return <Panel>Unable to load recently resolved props.</Panel>;
  }

  const forecasts = result.data;

  if (forecasts.length === 0) {
    return <Panel>No resolved props yet.</Panel>;
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
          resolutionDate={forecast.resolution_updated_at!}
        />
      ))}
    </div>
  );
}
