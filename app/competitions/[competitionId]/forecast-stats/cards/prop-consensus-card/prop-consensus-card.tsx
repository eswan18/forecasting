import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCategories, getForecasts } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
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
  const forecasts = forecastsResult.data;

  const categoriesResult = await getCategories();
  if (!categoriesResult.success) {
    throw new Error(categoriesResult.error);
  }
  const categories = categoriesResult.data;

  const user = await getUserFromCookies();
  const userId = user?.id ?? null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Consensus Forecasts</CardTitle>
        <CardDescription>
          We have crowds. But do we have wisdom?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PropConsensusContent
          forecasts={forecasts}
          categories={categories}
          userId={userId}
        />
      </CardContent>
    </Card>
  );
}
