import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getForecasts } from "@/lib/db_actions";
import { VForecast } from "@/types/db_types";

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
  const boldestForecasts = getForecastsFurthestFromMean(forecasts);
  return (
    <Card className="w-80 h-96">
      <CardHeader className="pb-4">
        <CardTitle>Boldest Takes</CardTitle>
        <CardDescription>Straying from the pack.</CardDescription>
      </CardHeader>
      <CardContent className="max-h-full">
        <ScrollArea className="h-64" type="auto">
          <div className="flex flex-col gap-y-4 h-fit">
            {boldestForecasts.map(
              ({ forecast, meanForecast, differenceFromMean }) => (
                <div
                  key={forecast.forecast_id}
                  className="flex flex-col justify-start items-center w-full text-xs"
                >
                  <span className="w-full">{forecast.prop_text}</span>
                  <div className="w-full grid grid-cols-[1fr_1fr_1fr] mt-1 text-right">
                    <div className="flex flex-col justify-start items-end gap-0.5">
                      <span className="text-muted-foreground">
                        {forecast.user_name}
                      </span>
                      <span className="text-sm">
                        {forecast.forecast.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col justify-start items-end gap-0.5">
                      <span className="text-muted-foreground">Others</span>
                      <span className="text-sm">{meanForecast.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col justify-start items-end gap-0.5">
                      <span className="text-muted-foreground">Difference</span>
                      <span className="text-sm">
                        {Math.abs(differenceFromMean).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </ScrollArea>
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
