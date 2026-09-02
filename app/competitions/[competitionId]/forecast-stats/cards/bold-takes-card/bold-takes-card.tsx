import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getForecasts } from "@/lib/db_actions";
import { type BinaryForecast, isBinaryForecast } from "@/lib/binary-forecast";
import BoldTakesContent, { BoldTake } from "./bold-takes-content";

export default async function BoldTakesCard({
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
  const takes: BoldTake[] = getForecastsFurthestFromMean(forecasts).map(
    ({ forecast, meanForecast, differenceFromMean }) => ({
      forecastId: forecast.forecast_id,
      propText: forecast.prop_text,
      userName: forecast.user_name,
      userForecast: forecast.forecast,
      meanForecast,
      differenceFromMean,
    }),
  );
  return (
    <Card className="w-80 h-96">
      <CardHeader className="pb-4">
        <CardTitle>Boldest Takes</CardTitle>
        <CardDescription>Straying from the pack.</CardDescription>
      </CardHeader>
      <CardContent className="max-h-full">
        <BoldTakesContent takes={takes} />
      </CardContent>
    </Card>
  );
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getAvgForecastByPropId(
  forecasts: BinaryForecast[],
): Map<number, number> {
  const forecastsByPropId: Map<number, number[]> = new Map();
  forecasts.forEach((forecast) => {
    const { prop_id, forecast: value } = forecast;
    if (!forecastsByPropId.has(prop_id)) {
      forecastsByPropId.set(prop_id, []);
    }
    forecastsByPropId.get(prop_id)!.push(value);
  });
  return new Map(
    Array.from(forecastsByPropId.entries()).map(([propId, forecasts]) => [
      propId,
      mean(forecasts),
    ]),
  );
}

interface ForecastWithMeanForecastForProp {
  forecast: BinaryForecast;
  meanForecast: number;
  differenceFromMean: number;
}

function getForecastsFurthestFromMean(
  forecasts: BinaryForecast[],
): ForecastWithMeanForecastForProp[] {
  const avgForecastsByPropId = getAvgForecastByPropId(forecasts);
  const forecastsWithMeanForecast: ForecastWithMeanForecastForProp[] =
    forecasts.map((forecast) => {
      const meanForecast = avgForecastsByPropId.get(forecast.prop_id)!;
      return {
        forecast,
        meanForecast,
        differenceFromMean: Math.abs(forecast.forecast - meanForecast),
      };
    });
  forecastsWithMeanForecast.sort(
    (a, b) => b.differenceFromMean - a.differenceFromMean,
  );
  return forecastsWithMeanForecast;
}
