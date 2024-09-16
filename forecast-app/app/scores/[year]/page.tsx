import { getAvgScoreByUser, getAvgScoreByUserAndCategory } from "@/lib/db_actions";
import UserScoresChart from "@/components/charts/user-scores-chart";
import PageHeading from "@/components/page-heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default async function Page({ params }: { params: { year: string } }) {
  const year = parseInt(params.year)
  const userScores = await getAvgScoreByUser({ year });
  const userScoresByCategory = await getAvgScoreByUserAndCategory({ year });
  const categories = Array.from(new Set(userScoresByCategory.map(({ category_name }) => category_name)));
  const scoresByCategory = categories.map((category) => {
    return userScoresByCategory.filter(({ category_name }) => category_name === category);
  });
  return (
    <main className="flex flex-col items-center justify-between py-12 px-24">
      <div className="w-full max-w-lg flex flex-col">
        <PageHeading title={`${year} Scores`} />
        <div className="p-2">
          <p className="my-1 italic">
            The below scores should be considered very much subject to change; I resolved only the propositions that seemed most clear-cut.
            Check out the <Link href="/props/2024" className="underline">2024 Props</Link> page to see the full list of propositions and which ones that I&apos;ve resolved.
          </p>
        </div>
        <Tabs defaultValue="Overall">
          <TabsList className="mt-3">
            <TabsTrigger value="Overall">Overall</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="Overall">
            <UserScoresChart userScores={userScores} />
          </TabsContent>
          {categories.map((category, index) => (
            <TabsContent key={category} value={category}>
              <UserScoresChart userScores={scoresByCategory[index]} />
            </TabsContent>
          ))}
        </Tabs>
        <div className="p-4 text-muted-foreground text-sm">
          <h2 className="mb-2 text-base">Details on Brier Scores</h2>
          <p className="my-1">
            Brier scores are a common way of measuring forecasting success. Lower scores are better.
          </p>
          <p className="my-1">
            For every prediction, a <span className="font-bold">penalty</span> is calculated. This penalty is the square of the size of the &quot;miss&quot;.
          </p>
          <p className="my-1">
            For example, if an event was predicted with 90% confidence and came to happen, the miss was 0.1, and the penatly is 0.01 (=0.1<sup>2</sup>).
            If the event <span className="italic">didn&apos;t</span> happen, then the miss is 0.9 and the penalty is 0.81 (=0.9<sup>2</sup>).
          </p>
          <p className="my-1">
            A user&apos;s <span className="font-bold">total score</span> is the average of all their penalties.
          </p>
        </div>
      </div>
    </main>
  )
}