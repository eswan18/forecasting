import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getForecasts } from "@/lib/db_actions";
import CertaintyContent, { AvgCertaintyForUser } from "./certainty-content";
import { type BinaryForecast, isBinaryForecast } from "@/lib/binary-forecast";

export default async function CertaintyCard({
  competitionId,
}: {
  competitionId: number;
}) {
  const forecastsResult = await getForecasts({ competitionId });
  if (!forecastsResult.success) {
    throw new Error(forecastsResult.error);
  }
  // Choice props are binary-only here for now; see docs/superpowers/specs/2026-09-01-choice-props-design.md §4.4
  const forecasts = forecastsResult.data.filter(isBinaryForecast);
  return (
    <Card className="w-80 h-96">
      <CardHeader className="pb-1">
        <CardTitle>Average Certainty</CardTitle>
        <CardDescription>Who&apos;s confident?</CardDescription>
      </CardHeader>
      <CardContent className="max-h-full">
        <CertaintyContent certainties={getAvgCertaintyByUser(forecasts)} />
      </CardContent>
    </Card>
  );
}

function getAvgCertaintyByUser(
  forecasts: BinaryForecast[],
): AvgCertaintyForUser[] {
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
  return Array.from(certainties.entries()).map(
    ([userId, { user_name, forecasts }]) => ({
      userId,
      userName: user_name,
      avgCertainty: forecasts.reduce((a, b) => a + b, 0) / forecasts.length,
    }),
  );
}
