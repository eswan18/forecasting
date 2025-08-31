import { Suspense } from "react";
import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";
import {
  BoldTakesCard,
  CertaintyCard,
  PropConsensusCard,
  SkeletonCard,
} from "./cards";

export default async function Page({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  const authUser = await getUserFromCookies();
  if (!authUser) {
    await loginAndRedirect({
      url: `/competitions/${competitionId}/forecasts/overview`,
    });
  }

  return (
    <div className="flex flex-row flex-wrap justify-center items-start gap-4 md:gap-8 mt-8 w-full">
      <Suspense
        fallback={
          <SkeletonCard
            title="Consensus Forecasts"
            className="w-full h-72 sm:h-[32rem]"
          />
        }
      >
        <PropConsensusCard competitionId={competitionId} />
      </Suspense>
      <Suspense
        fallback={
          <SkeletonCard title="Average Certainty" className="w-80 h-96" />
        }
      >
        <CertaintyCard competitionId={competitionId} />
      </Suspense>
      <Suspense
        fallback={<SkeletonCard title="Boldest Takes" className="w-80 h-96" />}
      >
        <BoldTakesCard competitionId={competitionId} />
      </Suspense>
    </div>
  );
}
