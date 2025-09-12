"use client";

import { getForecasts, getPropById } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { Loader2, ArrowDown, ArrowUp } from "lucide-react";
import { Suspense, useState, useEffect } from "react";
import PageHeading from "@/components/page-heading";
import ErrorPage from "@/components/pages/error-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VForecast, VProp } from "@/types/db_types";

type SortOrder = "asc" | "desc";

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

function PropPageContent({ params }: { params: Promise<{ propId: string }> }) {
  const [prop, setProp] = useState<VProp | null>(null);
  const [forecasts, setForecasts] = useState<VForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const { propId: propIdString } = await params;
        const propId = parseInt(propIdString, 10);

        if (isNaN(propId)) {
          setError(`Invalid prop ID '${propIdString}'`);
          return;
        }

        const user = await getUserFromCookies();
        if (!user) {
          setError("Please log in to view this prop");
          return;
        }

        // Get the prop details
        const propData = await getPropById(propId);
        if (!propData) {
          setError("Prop not found");
          return;
        }

        // Get all forecasts for this prop
        const forecastsData = await getForecasts({ propId });

        setProp(propData);
        setForecasts(forecastsData);
      } catch (err) {
        setError("Failed to load prop data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-24 h-24 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <ErrorPage title={error} />;
  }

  if (!prop) {
    return <ErrorPage title="Prop not found" />;
  }

  // Sort forecasts based on current sort order
  const sortedForecasts = [...forecasts].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.forecast - b.forecast;
    } else {
      return b.forecast - a.forecast;
    }
  });

  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <PageHeading title="Prop Details" />

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

        {/* Forecasts Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Forecasts ({forecasts.length})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                }
              >
                {sortOrder === "desc" ? (
                  <ArrowDown className="h-4 w-4 mr-2" />
                ) : (
                  <ArrowUp className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">
                  Sort: {sortOrder === "desc" ? "High to Low" : "Low to High"}
                </span>
                <span className="sm:hidden">
                  {sortOrder === "desc" ? "Desc" : "Asc"}
                </span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {forecasts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No forecasts have been made for this prop yet.
              </p>
            ) : (
              <div className="space-y-3">
                {sortedForecasts.map((forecast) => (
                  <div
                    key={forecast.forecast_id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{forecast.user_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg">
                        {(forecast.forecast * 100).toFixed(1)}%
                      </p>
                      {forecast.score !== null && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">
                            <span className="hidden sm:inline">
                              Penalty score:
                            </span>
                            <span className="sm:hidden">Penalty:</span>
                          </span>{" "}
                          <span className="font-mono">
                            {forecast.score.toFixed(4)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
