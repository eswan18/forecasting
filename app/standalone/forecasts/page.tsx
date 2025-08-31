import { getForecasts, getProps } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import ForecastGridListing from "./forecast-grid-listing";

export default async function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-24 h-24 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ForecastPage />
    </Suspense>
  );
}

async function ForecastPage() {
  const user = await getUserFromCookies();
  if (!user) {
    throw new Error("User not found");
  }
  const forecasts = await getForecasts({
    competitionId: null,
    userId: user.id,
    sort: { expr: "forecast_updated_at", modifiers: "desc" },
  });
  const props = await getProps({ competitionId: null });
  // We fetch all standalone props and forecasts, but there are duplicates in here:
  // any prop that has a forecast. So we remove props that also appear in the forecast
  // array.
  const filteredProps = props.filter(
    (prop) => !forecasts.some((forecast) => forecast.prop_id === prop.prop_id),
  );
  // remove this line later: wait 1 second to simulate loading
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return (
    <ForecastGridListing
      records={[...forecasts, ...filteredProps]}
      user={user}
    />
  );
}
