import { getCompetitions, getProps } from "@/lib/db_actions";
import CompetitionRow from "./competition-row";
import CreateCompetitionButton from "./create-competition-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import PageHeading from "@/components/page-heading";

export default async function Page() {
  const competitions = await getCompetitions();

  const propsResult = await getProps({});
  if (!propsResult.success) {
    throw new Error(propsResult.error);
  }
  const props = propsResult.data;

  // Count the number of props for each competition.
  const propCountsByCompetitionId = props.reduce(
    (acc, prop) => {
      const competitionId = prop.competition_id;
      if (competitionId === null) {
        return acc;
      }
      if (!acc[competitionId]) {
        acc[competitionId] = 0;
      }
      acc[competitionId]++;
      return acc;
    },
    {} as Record<number, number>,
  );

  // Count the number of resolved props for each competition.
  const resolvedPropCountsByCompetitionId = props.reduce(
    (acc, prop) => {
      const competitionId = prop.competition_id;
      if (competitionId === null || prop.resolution === null) {
        return acc;
      }
      if (!acc[competitionId]) {
        acc[competitionId] = 0;
      }
      acc[competitionId]++;
      return acc;
    },
    {} as Record<number, number>,
  );

  return (
    <main className="flex flex-col py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8 xl:py-12 xl:px-24">
      <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <PageHeading
          title="Competitions"
          breadcrumbs={{
            Home: "/",
            Admin: "/admin",
            Competitions: "/admin/competitions",
          }}
          icon={Trophy}
          iconGradient="bg-gradient-to-br from-orange-500 to-red-600"
          className="mb-2"
        />

        <div className="flex items-center justify-between">
          <div className="flex gap-2 sm:gap-4">
            <CreateCompetitionButton className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm sm:text-base" />
          </div>
        </div>

        {/* Competitions Table */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
              All Competitions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="space-y-0">
              {competitions.map((competition) => (
                <CompetitionRow
                  key={competition.id}
                  competition={competition}
                  nProps={propCountsByCompetitionId[competition.id] ?? 0}
                  nResolvedProps={
                    resolvedPropCountsByCompetitionId[competition.id] ?? 0
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
