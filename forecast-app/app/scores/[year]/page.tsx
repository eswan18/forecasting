import { getAvgScoreByUser } from "@/lib/db_actions";
import UserScoresChart from "@/components/charts/user-scores-chart";
import PageHeading from "@/components/page-heading";

export default async function Page({ params }: { params: { year: string } }) {
  const year = parseInt(params.year)
  const userScores = await getAvgScoreByUser({ year });
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-96 flex flex-col">
        <PageHeading title={`${year} Scores`} />
        <UserScoresChart userScores={userScores} />
      </div>
    </main>
  )
}