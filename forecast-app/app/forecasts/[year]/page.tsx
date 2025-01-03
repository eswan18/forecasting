import { Suspense } from "react";
import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";
import PageHeading from "@/components/page-heading";
import YearSelector from "./year-selector";
import { getPropYears } from "@/lib/db_actions";
import {
  BoldTakesCard,
  CertaintyCard,
  PropConsensusCard,
  SkeletonCard,
} from "./cards";

export default async function Page(
  { params }: { params: Promise<{ year: number }> },
) {
  const { year } = await params;
  const authUser = await getUserFromCookies();
  if (!authUser) await loginAndRedirect({ url: `/forecasts/${year}` });
  const years = await getPropYears();

  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <div className="w-full max-w-lg flex flex-row justify-start">
          <PageHeading
            title="Forecast Stats"
            className="flex flex-row justify-start items-start gap-x-4 md:gap-x-8"
          >
            <YearSelector
              years={years}
              selectedYear={year}
            />
          </PageHeading>
        </div>
        <div className="flex flex-row flex-wrap justify-center items-start gap-4 md:gap-8 mt-8 w-full">
          <Suspense
            fallback={
              <SkeletonCard
                title="Consensus Forecasts"
                className="w-full h-72 sm:h-[32rem]"
              />
            }
          >
            <PropConsensusCard year={year} />
          </Suspense>
          <Suspense
            fallback={
              <SkeletonCard title="Average Certainty" className="w-80 h-96" />
            }
          >
            <CertaintyCard year={year} />
          </Suspense>
          <Suspense
            fallback={
              <SkeletonCard title="Boldest Takes" className="w-80 h-96" />
            }
          >
            <BoldTakesCard year={year} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
