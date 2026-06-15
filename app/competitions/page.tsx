import { getCompetitions } from "@/lib/db_actions/competitions";
import { getUserFromCookies } from "@/lib/get-user";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Trophy, BarChart3, List } from "lucide-react";
import { CompetitionStatusBadge } from "@/app/admin/competitions/competition-status-badge";
import { LocalDate } from "@/components/local-date";
import { getCompetitionStatusFromObject } from "@/lib/competition-status";

export default async function CompetitionsPage() {
  const user = (await getUserFromCookies())!;

  const allCompetitionsResult = await getCompetitions();
  if (!allCompetitionsResult.success) {
    return (
      <main className="py-10 lg:py-14">
        <Container>
          <p className="text-destructive">
            Error: {allCompetitionsResult.error}
          </p>
        </Container>
      </main>
    );
  }
  const allCompetitions = allCompetitionsResult.data;

  // Filter competitions based on status (non-admins only see non-upcoming competitions)
  const competitions = user.is_admin
    ? allCompetitions
    : allCompetitions.filter((comp) => {
        const status = getCompetitionStatusFromObject(comp);
        return status !== "upcoming";
      });

  return (
    <main className="py-10 lg:py-14">
      <Container>
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Competitions
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Browse tournaments and jump into props, stats, or standings.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          {competitions.map((competition) => {
            const status = getCompetitionStatusFromObject(competition);

            return (
              <div
                key={competition.id}
                className="rounded-lg border bg-card p-5 transition-colors hover:border-foreground/20"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h2 className="truncate text-lg font-semibold tracking-tight">
                        {competition.name}
                      </h2>
                      <CompetitionStatusBadge status={status} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                      {status === "private" ? (
                        <span>Private competition — per-prop deadlines</span>
                      ) : (
                        <>
                          {competition.forecasts_close_date && (
                            <span>
                              Forecasts due{" "}
                              <span className="font-mono tabular-nums text-foreground">
                                <LocalDate
                                  date={competition.forecasts_close_date}
                                />
                              </span>
                            </span>
                          )}
                          {competition.end_date && (
                            <span>
                              Ends{" "}
                              <span className="font-mono tabular-nums text-foreground">
                                <LocalDate date={competition.end_date} />
                              </span>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    <Button asChild variant="ghost" size="sm" className="flex-1 sm:flex-none">
                      <Link href={`/competitions/${competition.id}`}>
                        <List className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Props</span>
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="flex-1 sm:flex-none">
                      <Link
                        href={`/competitions/${competition.id}/forecast-stats`}
                      >
                        <BarChart3 className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Stats</span>
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="flex-1 sm:flex-none">
                      <Link
                        href={`/competitions/${competition.id}?tab=leaderboard`}
                      >
                        <Trophy className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Scores</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {competitions.length === 0 && (
          <div className="rounded-lg border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No competitions available at this time.
            </p>
          </div>
        )}
      </Container>
    </main>
  );
}
