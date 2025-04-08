import ForecastCard from "@/components/forecast-card";
import { getForecasts, getProps } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { Suspense } from "react";

export default async function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 justify-between gap-4 items-start">
      {[...filteredProps, ...forecasts].map((record) => (
        <ForecastCard
          key={record.prop_id}
          record={record}
          userId={user.id}
        />
      ))}
    </div>
  );
}
