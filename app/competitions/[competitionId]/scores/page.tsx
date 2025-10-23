import {
  getCategories,
  getCompetitionById,
  getForecasts,
} from "@/lib/db_actions";
import PageHeading from "@/components/page-heading";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Suspense } from "react";
import { loginAndRedirect } from "@/lib/get-user";

import { ScoreChartsCard } from "./score-charts-card";
import { getUserFromCookies } from "@/lib/get-user";
import SkeletonCard from "./skeleton-card";
import ErrorPage from "@/components/pages/error-page";
import { Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function Page({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId: competitionIdString } = await params;
  const competitionId = parseInt(competitionIdString, 10);
  const competition = await getCompetitionById(competitionId);
  if (!competition) {
    return <ErrorPage title="Competition not found" />;
  }
  const user = await getUserFromCookies();
  if (!user) {
    await loginAndRedirect({ url: `competitions/${competitionId}/scores` });
  }
  const linkToProps = `/competitions/${competitionId}/props`;
  return (
    <main className="flex flex-col items-start py-4 px-8 lg:py-8 lg:px-24 w-full">
      <PageHeading
        title={`${competition.name} - Scores`}
        breadcrumbs={{
          Competitions: "/competitions",
          [competition.name]: `/competitions/${competition.id}`,
          Scores: `/competitions/${competition.id}/scores`,
        }}
        icon={Medal}
        iconGradient="bg-gradient-to-br from-green-700 to-cyan-400"
      />
      {!competition.visible && (
        <Badge variant="secondary" className="text-xs">
          Not Visible to Users
        </Badge>
      )}
      <Suspense
        fallback={
          <SkeletonCard className="w-full max-w-lg flex flex-col bg-background h-[32rem]" />
        }
      >
        <ScoreChartsCardSection competitionId={competitionId} />
      </Suspense>
      <Accordion type="single" collapsible className="w-full mb-3">
        <AccordionItem value="brier-scores">
          <AccordionTrigger>How Brier Scores Work</AccordionTrigger>
          <AccordionContent className="[&>p]:mb-2">
            <p>
              Brier scores are a common way of measuring forecasting success.
              Lower scores are better.
            </p>
            <p>
              For every prediction, a <span className="font-bold">penalty</span>{" "}
              is calculated. This penalty is the square of the size of the
              &quot;miss&quot;.
            </p>
            <p>
              For example, if an event was predicted with 90% confidence and
              came to happen, the miss was 0.1, and the penalty is 0.01 (=0.1
              <sup>2</sup>). If the event{" "}
              <span className="italic">didn&apos;t</span> happen, then the miss
              is 0.9 and the penalty is 0.81 (=0.9<sup>2</sup>).
            </p>
            <p>
              A user&apos;s <span className="font-bold">total score</span> is
              the average of all their penalties.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="scoring-to-change">
          <AccordionTrigger>Scores Are Subject to Change</AccordionTrigger>
          <AccordionContent>
            The below scores should be considered very much subject to change; I
            resolved only the propositions that seemed most clear-cut. Check out
            your{" "}
            <Link href={linkToProps} className="underline">
              Props page
            </Link>{" "}
            to see which have been resolved.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  );
}

async function ScoreChartsCardSection({
  competitionId,
}: {
  competitionId: number;
}) {
  // We break this out so that we can wrap it in a Suspense component.
  const categories = await getCategories();
  const forecasts = await getForecasts({ competitionId });
  return <ScoreChartsCard forecasts={forecasts} categories={categories} />;
}
