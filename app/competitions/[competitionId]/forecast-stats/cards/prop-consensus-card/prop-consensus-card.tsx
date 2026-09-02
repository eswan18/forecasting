import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCategories, getForecasts } from "@/lib/db_actions";
import { isBinaryForecast } from "@/lib/binary-forecast";
import PropConsensusContent from "./prop-consensus-content";

export default async function PropConsensusCard({
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

  const categoriesResult = await getCategories();
  if (!categoriesResult.success) {
    throw new Error(categoriesResult.error);
  }
  const categories = categoriesResult.data;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Consensus Forecasts</CardTitle>
        <CardDescription>
          We have crowds. But do we have wisdom?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PropConsensusContent forecasts={forecasts} categories={categories} />
      </CardContent>
    </Card>
  );
}
