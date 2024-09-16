import { getAvgScoreByUser, getAvgScoreByUserAndCategory } from "@/lib/db_actions";
import UserScoresChart from "@/components/charts/user-scores-chart";
import PageHeading from "@/components/page-heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      </div>
    </main>
  )
}