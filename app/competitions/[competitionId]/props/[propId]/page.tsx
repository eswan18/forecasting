import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import ErrorPage from "@/components/pages/error-page";
import { InaccessiblePage } from "@/components/inaccessible-page";
import { Spinner } from "@/components/ui/spinner";
import { getCompetitionById } from "@/lib/db_actions";
import { getCurrentUserRole } from "@/lib/db_actions/competition-members";
import { getUserFromCookies } from "@/lib/get-user";
import { getPropsWithUserForecasts } from "@/lib/db_actions/forecasts";
import { CompetitionPropView } from "./competition-prop-view";

export default function CompetitionPropPage({
  params,
}: {
  params: Promise<{ competitionId: string; propId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <Spinner className="w-24 h-24 text-muted-foreground" />
        </div>
      }
    >
      <CompetitionPropPageContent params={params} />
    </Suspense>
  );
}

async function CompetitionPropPageContent({
  params,
}: {
  params: Promise<{ competitionId: string; propId: string }>;
}) {
  const { competitionId: competitionIdString, propId: propIdString } =
    await params;
  const competitionId = parseInt(competitionIdString, 10);
  const propId = parseInt(propIdString, 10);

  if (isNaN(competitionId)) {
    return (
      <ErrorPage title={`Invalid competition ID '${competitionIdString}'`} />
    );
  }
  if (isNaN(propId)) {
    return <ErrorPage title={`Invalid prop ID '${propIdString}'`} />;
  }

  const user = await getUserFromCookies();
  if (!user) {
    redirect("/login");
  }

  // Get competition details
  const competitionResult = await getCompetitionById(competitionId);
  if (!competitionResult.success) {
    return <ErrorPage title={competitionResult.error} />;
  }
  const competition = competitionResult.data;

  // For private competitions, verify membership
  if (competition.is_private) {
    const roleResult = await getCurrentUserRole(competitionId);
    if (!roleResult.success) {
      return <ErrorPage title={roleResult.error} />;
    }

    if (roleResult.data === null) {
      return (
        <InaccessiblePage
          title="Private Competition"
          message="You are not a member of this competition."
        />
      );
    }
  }

  // Get the prop with user's forecast
  const propsResult = await getPropsWithUserForecasts({
    userId: user.id,
    competitionId,
  });
  if (!propsResult.success) {
    return <ErrorPage title={propsResult.error} />;
  }

  const prop = propsResult.data.find((p) => p.prop_id === propId);
  if (!prop) {
    notFound();
  }

  // Check if forecasting is still open
  const now = new Date();
  const forecastsDueDate = prop.prop_forecasts_due_date
    ? new Date(prop.prop_forecasts_due_date)
    : null;
  const isForecastingOpen = forecastsDueDate === null || forecastsDueDate > now;

  return (
    <CompetitionPropView
      prop={prop}
      competitionId={competitionId}
      competitionName={competition.name}
      isForecastingOpen={isForecastingOpen}
      isAdmin={user.is_admin}
    />
  );
}
