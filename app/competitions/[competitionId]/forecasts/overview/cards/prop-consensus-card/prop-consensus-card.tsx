import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCategories, getForecasts, getProps } from "@/lib/db_actions";
import PropConsensusContent from "./prop-consensus-content";

export default async function PropConsensusCard(
  { competitionId }: { competitionId: number },
) {
  const forecasts = await getForecasts({ competitionId });
  const props = await getProps({ competitionId });
  const categories = await getCategories();
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
          props={props}
          forecasts={forecasts}
          categories={categories}
        />
      </CardContent>
    </Card>
  );
}
