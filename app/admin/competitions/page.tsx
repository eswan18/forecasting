import Link from "next/link";
import { getCompetitions, getProps } from "@/lib/db_actions";
import CompetitionRow from "./competition-row";
import CreateCompetitionButton from "./create-competition-button";
import { Container } from "@/components/ui/container";

export default async function Page() {
  const competitionsResult = await getCompetitions();
  if (!competitionsResult.success) {
    throw new Error(competitionsResult.error);
  }
  const competitions = competitionsResult.data;

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
    <main className="py-10 lg:py-14">
      <Container>
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/admin"
              className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Admin
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Competitions
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Create competitions and review their props and resolutions.
            </p>
          </div>
          <CreateCompetitionButton className="shrink-0" />
        </header>

        {/* Competitions table */}
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-4 py-3 sm:px-5">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              All Competitions ({competitions.length})
            </span>
          </div>
          <div className="divide-y">
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
            {competitions.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No competitions yet.
              </p>
            )}
          </div>
        </section>
      </Container>
    </main>
  );
}
