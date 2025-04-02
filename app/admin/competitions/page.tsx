import PageHeading from "@/components/page-heading";
import { getCompetitions, getProps } from "@/lib/db_actions";
import CompetitionRow from "./competition-row";

export default async function Page() {
  const competitions = await getCompetitions();
  const props = await getProps({});
  // Count the number of props for each competition.
  const propCountsByCompetitionId = props.reduce((acc, prop) => {
    const competitionId = prop.competition_id;
    if (competitionId === null) {
      return acc;
    }
    if (!acc[competitionId]) {
      acc[competitionId] = 0;
    }
    acc[competitionId]++;
    return acc;
  }, {} as Record<number, number>);
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-2xl">
        <PageHeading title="Competitions" />
        {competitions.map((competition) => (
          <CompetitionRow
            key={competition.id}
            competition={competition}
            nProps={propCountsByCompetitionId[competition.id]}
          />
        ))}
      </div>
    </main>
  );
}
