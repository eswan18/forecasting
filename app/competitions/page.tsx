import PageHeading from "@/components/page-heading";
import { getCompetitions } from "@/lib/db_actions/competitions";
import { getUserFromCookies } from "@/lib/get-user";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, BarChart3, List } from "lucide-react";
import { CompetitionStatusBadge } from "@/app/admin/competitions/competition-status-badge";
import { formatDate } from "@/lib/time-utils";
import { getCompetitionStatusFromObject } from "@/lib/competition-status";

export default async function CompetitionsPage() {
  const user = (await getUserFromCookies())!;

  const allCompetitionsResult = await getCompetitions();
  if (!allCompetitionsResult.success) {
    return (
      <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
        <div className="w-full max-w-6xl">
          <p className="text-destructive">
            Error: {allCompetitionsResult.error}
          </p>
        </div>
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
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-6xl">
        <PageHeading title="Competitions" breadcrumbs={{}} className="mb-8" />

        <div className="grid grid-cols-1 gap-6">
          {competitions.map((competition) => {
            const status = getCompetitionStatusFromObject(competition);

            return (
              <Card
                key={competition.id}
                className="hover:shadow-md transition-shadow"
              >
                {/* Desktop layout */}
                <div className="hidden md:flex items-center justify-between p-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Trophy className="h-5 w-5 text-primary shrink-0" />
                      <h3 className="text-lg font-semibold truncate">
                        {competition.name}
                      </h3>
                      <CompetitionStatusBadge status={status} />
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">Forecasts due:</span>{" "}
                        {formatDate(competition.forecasts_close_date)}
                      </p>
                      <p>
                        <span className="font-medium">Ends:</span>{" "}
                        {formatDate(competition.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-6 shrink-0">
                    <Button asChild variant="ghost">
                      <Link href={`/competitions/${competition.id}`}>
                        <List className="h-4 w-4 mr-2" />
                        Props
                      </Link>
                    </Button>
                    <Button asChild variant="ghost">
                      <Link
                        href={`/competitions/${competition.id}/forecast-stats`}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Stats
                      </Link>
                    </Button>
                    <Button asChild variant="ghost">
                      <Link href={`/competitions/${competition.id}/scores`}>
                        <Trophy className="h-4 w-4 mr-2" />
                        Scores
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="md:hidden">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">
                        {competition.name}
                      </CardTitle>
                      <CompetitionStatusBadge status={status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">Forecasts due:</span>{" "}
                        {formatDate(competition.forecasts_close_date)}
                      </p>
                      <p>
                        <span className="font-medium">Ends:</span>{" "}
                        {formatDate(competition.end_date)}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="mt-auto">
                    <div className="flex gap-x-2 w-full">
                      <Button asChild variant="ghost" className="flex-1">
                        <Link href={`/competitions/${competition.id}`}>
                          <List className="h-4 w-4 mr-2" />
                          Props
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" className="flex-1">
                        <Link
                          href={`/competitions/${competition.id}/forecast-stats`}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Stats
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" className="flex-1">
                        <Link href={`/competitions/${competition.id}/scores`}>
                          <Trophy className="h-4 w-4 mr-2" />
                          Scores
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </div>
              </Card>
            );
          })}
        </div>

        {competitions.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              No competitions available at this time.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
