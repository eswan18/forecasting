import PageHeading from "@/components/page-heading";
import { getPropsWithUserForecasts } from "@/lib/db_actions/forecasts";
import { getUserFromCookies } from "@/lib/get-user";
import { PropsTable } from "@/components/props/props-table";
import { ForecastablePropsTable } from "@/components/forecastable-props-table";
import { Trophy, BarChart3, ChartLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CompetitionStartEnd from "./competition-start-end";
import { getCompetitionById } from "@/lib/db_actions";
import ErrorPage from "@/components/pages/error-page";
import { InaccessiblePage } from "@/components/inaccessible-page";
import Link from "next/link";
import { getCompetitionStatus } from "@/lib/competition-status";

export default async function Page({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  if (isNaN(competitionId)) {
    return (
      <ErrorPage title={`Invalid competition ID '${competitionIdString}'`} />
    );
  }
  const user = await getUserFromCookies();
  const allowEdits = user?.is_admin || false;

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }
  const competition = await getCompetitionById(competitionId);
  if (!competition) {
    return <ErrorPage title="Competition not found" />;
  }

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
  const competitionForecastsAreOpen = competitionStatus === "forecasts-open";
  const propsWithForecasts = await getPropsWithUserForecasts({
    userId: user.id,
    competitionId,
  });

  return (
    <main className="flex flex-col items-start py-4 px-8 lg:py-8 lg:px-24 w-full">
      <PageHeading
        title={competition.name}
        breadcrumbs={{
          Home: "/",
          Competitions: "/competitions",
          [competition.name]: `/competitions/${competition.id}`,
        }}
        icon={Trophy}
        iconGradient="bg-gradient-to-br from-yellow-500 to-orange-600"
        className="mb-2"
      >
        {competitionStatus === "upcoming" && (
          <Badge variant="destructive" className="text-xs">
            Not Visible to Users
          </Badge>
        )}
        {competitionForecastsAreOpen && (
          <Badge variant="default">Forecasts Open</Badge>
        )}
      </PageHeading>
      <CompetitionStartEnd competition={competition} />

      {competitionForecastsAreOpen ? (
        <>
          {/* Show PropsToForecastTable when forecasts are open */}
          <ForecastablePropsTable
            props={propsWithForecasts}
            canCreateProps={allowEdits} // Only admins can create competition props
            competitionId={competitionId}
            defaultUserId={user.id}
          />
        </>
      ) : (
        <>
          {/* Navigation Links */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link href={`/competitions/${competitionId}/scores`}>
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                View Scores
              </Button>
            </Link>
            <Link href={`/competitions/${competitionId}/forecast-stats`}>
              <Button variant="outline" className="flex items-center gap-2">
                <ChartLine className="h-4 w-4" />
                Forecasts Stats
              </Button>
            </Link>
          </div>
          <PropsTable
            props={propsWithForecasts}
            canCreateProps={allowEdits} // Only admins can create competition props
            canEditProps={allowEdits} // Only admins can edit competition props
            canEditResolutions={allowEdits} // Only admins can resolve competition props
            competitionId={competitionId}
          />
        </>
      )}
    </main>
  );
}
