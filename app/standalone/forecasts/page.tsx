import ForecastCard from "@/components/forecast-card";
import CreateNewPropButton from "@/components/tables/prop-table/create-new-prop-button";
import { getForecasts, getProps } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

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
    sort: "forecast_updated_at desc",
  });
  const props = await getProps({ competitionId: null });
  // We fetch all standalone props and forecasts, but there are duplicates in here:
  // any prop that has a forecast. So we remove props that also appear in the forecast
  // array.
  const filteredProps = props.filter((prop) =>
    !forecasts.some((forecast) => forecast.prop_id === prop.prop_id)
  );
  // remove this line later: wait 1 second to simulate loading
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return (
    <div className="flex flex-col gap-y-4">
      <CreateNewPropButton defaultUserId={user?.id} />
      <div className="grid grid-cols-1 sm:grid-cols-2 justify-between gap-4 items-start">
        {[...filteredProps, ...forecasts].map((record) => (
          <ForecastCard
            key={record.prop_id}
            record={record}
            userId={user.id}
          />
        ))}
      </div>
    </div>
  );
}
