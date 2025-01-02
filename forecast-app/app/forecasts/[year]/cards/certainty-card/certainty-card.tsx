import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getForecasts } from "@/lib/db_actions";
import CertaintyContent, { AvgCertaintyForUser } from "./certainty-content";
import { VForecast } from "@/types/db_types";

export default async function CertaintyCard({ year }: { year: number }) {
  const forecasts = await getForecasts({ year });
  return (
    <Card className="w-72 h-96">
      <CardHeader className="pb-1">
        <CardTitle>Average Certainty</CardTitle>
        <CardDescription>
          Who&apos;s confident?
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-full">
        <CertaintyContent certainties={getAvgCertaintyByUser(forecasts)} />
      </CardContent>
    </Card>
  );
}

function getAvgCertaintyByUser(forecasts: VForecast[]): AvgCertaintyForUser[] {
  // "Certainty" is defined as the average distance from 0.5 for each prediction.
  const certainties: Map<number, { user_name: string; forecasts: number[] }> =
    new Map();
  forecasts.forEach((forecast) => {
    const { user_id, user_name, forecast: value } = forecast;
    if (!certainties.has(user_id)) {
      certainties.set(user_id, { user_name, forecasts: [] });
    }
    const certainty = Math.abs(value - 0.5);
    certainties.get(user_id)!.forecasts.push(certainty);
  });
  return Array.from(certainties.entries()).map((
    [userId, { user_name, forecasts }],
  ) => ({
    userId,
    userName: user_name,
    avgCertainty: forecasts.reduce((a, b) => a + b, 0) / forecasts.length,
  }));
}
