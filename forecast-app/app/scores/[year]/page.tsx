import { getCategories, getForecasts } from "@/lib/db_actions";
import PageHeading from "@/components/page-heading";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { ScoreChartsCard } from "./score-charts-card";
import { getUserFromCookies } from "@/lib/get-user";

export default async function Page(
  { params }: { params: Promise<{ year: number }> },
) {
  const user = await getUserFromCookies();
  if (!user) {
    redirect("/login");
  }
  const { year } = await params;
  const categories = await getCategories();
  const forecasts = await getForecasts({ year });
  const linkToForecasts = `/forecasts/${year}/user/${user.id}`;
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg flex flex-col">
        <PageHeading title={`${year} Scores`} />
        <Accordion type="single" collapsible className="w-full mb-3">
          <AccordionItem value="brier-scores">
            <AccordionTrigger>How Brier Scores Work</AccordionTrigger>
            <AccordionContent className="[&>p]:mb-2">
              <p>
                Brier scores are a common way of measuring forecasting success.
                Lower scores are better.
              </p>
              <p>
                For every prediction, a{" "}
                <span className="font-bold">penalty</span>{" "}
                is calculated. This penalty is the square of the size of the
                &quot;miss&quot;.
              </p>
              <p>
                For example, if an event was predicted with 90% confidence and
                came to happen, the miss was 0.1, and the penatly is 0.01
                (=0.1<sup>
                  2
                </sup>). If the event{" "}
                <span className="italic">didn&apos;t</span>{" "}
                happen, then the miss is 0.9 and the penalty is 0.81 (=0.9<sup>
                  2
                </sup>).
              </p>
              <p>
                A user&apos;s <span className="font-bold">total score</span>
                {" "}
                is the average of all their penalties.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="scoring-to-change">
            <AccordionTrigger>Scores Are Subject to Change</AccordionTrigger>
            <AccordionContent>
              The below scores should be considered very much subject to change;
              I resolved only the propositions that seemed most clear-cut. Check
              out your{" "}
              <Link href={linkToForecasts} className="underline">
                Forecasts page
              </Link>{" "}
              to see which have been resolved.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <ScoreChartsCard forecasts={forecasts} categories={categories} />
      </div>
    </main>
  );
}
