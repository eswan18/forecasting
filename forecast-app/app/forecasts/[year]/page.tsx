import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";
import PageHeading from "@/components/page-heading";
import YearSelector from "./year-selector";
import { getPropYears } from "@/lib/db_actions";
import ControversyCard from "./cards/controversy-card";
import CertaintyCard from "./cards/certainty-card";
import SkeletonCard from "./cards/skeleton-card";
import PropConsensusCard from "./cards/prop-consensus-card";
import { Suspense } from "react";

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
          <PageHeading title="Forecast Overview">
            <YearSelector
              years={years}
              selectedYear={year}
            />
          </PageHeading>
        </div>
        <div className="flex flex-row flex-wrap justify-center items-start gap-4 md:gap-12 mt-8 w-full">
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
          <Suspense fallback={<SkeletonCard title="Average Certainty" />}>
            <CertaintyCard year={year}/>
          </Suspense>
          {
            /*
          <Suspense fallback={<SkeletonCard title="Controversial Props" />}>
            <ControversyCard />
          </Suspense>
          <Suspense fallback={<SkeletonCard title="Controversial Props" />}>
            <SkeletonCard title="Controversy!" />
          </Suspense>*/
          }
        </div>
      </div>
    </main>
  );
}
