import { Suspense } from "react";
import { getUserFromCookies } from "@/lib/get-user";
import {
  BoldTakesCard,
  CertaintyCard,
  PropConsensusCard,
  SkeletonCard,
} from "./cards";
import ErrorPage from "@/components/pages/error-page";
import { getCompetitionById } from "@/lib/db_actions";
import { InaccessiblePage } from "@/components/inaccessible-page";
import { Container } from "@/components/ui/container";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCompetitionStatus } from "@/lib/competition-status";

export default async function Page({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  const user = (await getUserFromCookies())!;
  const competitionResult = await getCompetitionById(competitionId);
  if (!competitionResult.success) {
    return <ErrorPage title={competitionResult.error} />;
  }
  const competition = competitionResult.data;
  const competitionStatus = getCompetitionStatus(
    competition.forecasts_open_date,
    competition.forecasts_close_date,
    competition.end_date,
  );
  const pageIsVisible = user.is_admin || competitionStatus !== "upcoming";
  if (!pageIsVisible) {
    return (
      <InaccessiblePage
        title="Competition Not Available"
        message="This competition is not currently visible to users."
      />
    );
  }

  return (
    <main className="py-10 lg:py-14">
      <Container>
        <header className="mb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/competitions">
                  Competitions
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/competitions/${competition.id}`}>
                  {competition.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="mt-4">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Forecast Stats
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {competition.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Where the crowd agrees, diverges, and commits.
            </p>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="flex flex-row flex-wrap items-start justify-center gap-4">
          <Suspense
            fallback={
              <SkeletonCard
                title="Consensus Forecasts"
                className="w-full h-72 sm:h-128"
              />
            }
          >
            <PropConsensusCard competitionId={competitionId} />
          </Suspense>
          <Suspense
            fallback={
              <SkeletonCard title="Average Certainty" className="w-80 h-96" />
            }
          >
            <CertaintyCard competitionId={competitionId} />
          </Suspense>
          <Suspense
            fallback={
              <SkeletonCard title="Boldest Takes" className="w-80 h-96" />
            }
          >
            <BoldTakesCard competitionId={competitionId} />
          </Suspense>
        </div>
      </Container>
    </main>
  );
}
