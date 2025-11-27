import { Suspense } from "react";
import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";
import {
  BoldTakesCard,
  CertaintyCard,
  PropConsensusCard,
  SkeletonCard,
} from "./cards";
import ErrorPage from "@/components/pages/error-page";
import { getCompetitionById } from "@/lib/db_actions";
import { InaccessiblePage } from "@/components/inaccessible-page";
import PageHeading from "@/components/page-heading";
import { ChartLine } from "lucide-react";
import { getCompetitionStatus } from "@/lib/competition-status";

export default async function Page({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  const user = await getUserFromCookies();
  if (!user) {
    await loginAndRedirect({
      url: `/competitions/${competitionId}/forecast-stats`,
    });
    return null;
  }
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
    <main className="flex flex-col justify-start items-start gap-4 py-4 px-8 lg:py-8 lg:px-24 w-full">
      <PageHeading
        title={`${competition.name} - Stats`}
        breadcrumbs={{
          Competitions: "/competitions",
          [competition.name]: `/competitions/${competition.id}`,
          "Forecast Stats": `/competitions/${competition.id}/forecast-stats`,
        }}
        icon={ChartLine}
        iconGradient="bg-gradient-to-br from-blue-500 to-purple-600"
      />
      {/* Stats Cards */}
      <div className="flex flex-row flex-wrap justify-center items-start gap-4">
        <Suspense
          fallback={
            <SkeletonCard
              title="Consensus Forecasts"
              className="w-full h-72 sm:h-[32rem]"
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
    </main>
  );
}
