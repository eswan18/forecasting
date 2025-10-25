import { getForecasts, getPropById } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { CircleQuestionMark, Loader2 } from "lucide-react";
import { Suspense } from "react";
import PageHeading from "@/components/page-heading";
import ErrorPage from "@/components/pages/error-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ForecastsList from "./forecasts-list";
import ForecastDensityChart from "./forecast-density-chart";
import PropDetailsWithActions from "./prop-details-with-actions";

export default function PropPage({
  params,
}: {
  params: Promise<{ propId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-24 h-24 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PropPageContent params={params} />
    </Suspense>
  );
}

async function PropPageContent({
  params,
}: {
  params: Promise<{ propId: string }>;
}) {
  const { propId: propIdString } = await params;
  const propId = parseInt(propIdString, 10);

  if (isNaN(propId)) {
    return <ErrorPage title={`Invalid prop ID '${propIdString}'`} />;
  }

  const user = await getUserFromCookies();
  if (!user) {
    return <ErrorPage title="Please log in to view this prop" />;
  }

  // Get the prop details
  const prop = await getPropById(propId);
  if (!prop) {
    return <ErrorPage title="Prop not found" />;
  }

  // Get all forecasts for this prop
  const forecasts = await getForecasts({ propId });

  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <PageHeading
        title={prop.prop_text}
        breadcrumbs={{
          Home: "/",
          Props: "/props",
        }}
        icon={CircleQuestionMark}
        iconGradient="bg-gradient-to-br from-purple-500 to-pink-600"
      />

      <div className="w-full max-w-4xl space-y-6">
        {/* Prop Details Card */}
        <PropDetailsWithActions
          prop={prop}
          canResolve={user.is_admin || prop.prop_user_id === user.id}
        />

        {/* Forecast Density Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Forecast Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ForecastDensityChart forecasts={forecasts} />
          </CardContent>
        </Card>

        {/* Forecasts Section */}
        <ForecastsList forecasts={forecasts} />
      </div>
    </main>
  );
}
