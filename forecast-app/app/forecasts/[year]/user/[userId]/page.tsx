import PageHeading from "@/components/page-heading";
import { getForecasts, getUserById } from "@/lib/db_actions";
import { notFound } from "next/navigation";
import ForecastTable from "./forecast-table";
import { forecastColumns } from "./forecast-columns";
import { getUserFromCookies } from "@/lib/get-user";
import { redirect } from "next/navigation";

export default async function Page(
  { params }: { params: Promise<{ year: number; userId: number }> },
) {
  const authUser = await getUserFromCookies();
  if (!authUser) {
    redirect("/login");
  }
  const { year, userId } = await params;
  const requestedUser = await getUserById(userId);
  if (!requestedUser) {
    notFound();
  }
  const forecasts = await getForecasts({ userId, year });
  const scoredForecasts = forecasts.map((forecast) => {
    const resolution = forecast.resolution;
    if (resolution === null) {
      return {
        ...forecast,
        penalty: null,
      };
    }
    const resolutionAsNumber = resolution ? 1 : 0;
    const penalty = Math.pow(forecast.forecast - resolutionAsNumber, 2) || null;
    return {
      ...forecast,
      penalty,
    };
  });
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title={`Forecasts: ${requestedUser.name}, ${year}`} />
        <ForecastTable data={scoredForecasts} columns={forecastColumns} />
      </div>
    </main>
  );
}
