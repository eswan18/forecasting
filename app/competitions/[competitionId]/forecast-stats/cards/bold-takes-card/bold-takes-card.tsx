import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getForecasts } from "@/lib/db_actions";
import { VForecast } from "@/types/db_types";
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
  const forecasts = forecastsResult.data;
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

function getAvgForecastByPropId(forecasts: VForecast[]): Map<number, number> {
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
  forecast: VForecast;
  meanForecast: number;
  differenceFromMean: number;
}

function getForecastsFurthestFromMean(
  forecasts: VForecast[],
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
