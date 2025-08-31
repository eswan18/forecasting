import { VForecast } from "@/types/db_types";

export function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function quantile(values: number[], p: number): number {
  const sortedValues = values.slice().sort((a, b) => a - b);
  const index = p * (sortedValues.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  return (
    sortedValues[lowerIndex] +
    (sortedValues[upperIndex] - sortedValues[lowerIndex]) * (index - lowerIndex)
  );
}

export interface PropStatistics {
  prop_id: number;
  prop_text: string;
  mean: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
}

export function propStatisticsForForecasts(
  forecasts: VForecast[],
): Map<number, PropStatistics> {
  const forecastsByProp = new Map<number, VForecast[]>();
  for (const forecast of forecasts) {
    const forecastsForProp = forecastsByProp.get(forecast.prop_id) || [];
    forecastsForProp.push(forecast);
    forecastsByProp.set(forecast.prop_id, forecastsForProp);
  }
  const propStatisticsByPropId = new Map<number, PropStatistics>();
  for (const [propId, forecastsForProp] of forecastsByProp) {
    const values = forecastsForProp.map((forecast) => forecast.forecast);
    propStatisticsByPropId.set(propId, {
      prop_id: propId,
      prop_text: forecastsForProp[0].prop_text,
      mean: mean(values),
      min: Math.min(...values),
      max: Math.max(...values),
      p25: quantile(values, 0.25),
      p75: quantile(values, 0.75),
    });
  }
  return propStatisticsByPropId;
}
