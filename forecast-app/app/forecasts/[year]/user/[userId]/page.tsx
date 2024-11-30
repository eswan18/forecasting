import PageHeading from "@/components/page-heading";
import {
  getForecasts,
  getPropYears,
  getUserById,
  getUsers,
} from "@/lib/db_actions";
import { notFound } from "next/navigation";
import ForecastTable from "./forecast-table";
import { getUserFromCookies } from "@/lib/get-user";
import { redirect } from "next/navigation";
import UserYearSelector from "./user-year-selector";

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
  const allUsers = await getUsers({ sort: "name asc" });
  const years = await getPropYears();
  const forecasts = await getForecasts({ userId, year });
  const thisYear = new Date().getFullYear();
  const scoredForecasts = forecasts.map((forecast) => {
    const resolution = forecast.resolution;
    let penalty = null;
    if (resolution !== null) {
      const resolutionAsNumber = resolution ? 1 : 0;
      penalty = Math.pow(forecast.forecast - resolutionAsNumber, 2) || null;
    }
    return {
      ...forecast,
      penalty,
    };
  });
  const editable = year > thisYear && authUser.id === requestedUser.id;
  const scored = year <= thisYear;
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Forecasts">
          <UserYearSelector
            users={allUsers}
            selectedUserId={requestedUser.id}
            years={years}
            selectedYear={year}
          />
        </PageHeading>
        <ForecastTable
          data={scoredForecasts}
          editable={editable}
          scored={scored}
        />
      </div>
    </main>
  );
}
