import { getForecasts, getPropById } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { CircleQuestionMark, Loader2 } from "lucide-react";
import { Suspense } from "react";
import PageHeading from "@/components/page-heading";
import ErrorPage from "@/components/pages/error-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ForecastsList from "./forecasts-list";
import ForecastDensityChart from "./forecast-density-chart";

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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{prop.prop_text}</CardTitle>
            <div className="flex gap-2 flex-wrap">
              {prop.category_name && (
                <Badge variant="secondary">{prop.category_name}</Badge>
              )}
              <Badge variant={prop.resolution === null ? "outline" : "default"}>
                {prop.resolution === null
                  ? "Unresolved"
                  : prop.resolution
                    ? "True"
                    : "False"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {prop.prop_notes && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {prop.prop_notes}
                </p>
              </div>
            )}
            {prop.resolution_notes && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground/70 mb-1">
                  Resolution Notes
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {prop.resolution_notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
