import { getUserFromCookies } from "@/lib/get-user";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  BarChart3,
  MessageCircleWarning,
  Newspaper,
  Medal,
  CheckCircle,
} from "lucide-react";
import MiniLeaderboard from "@/components/landing/mini-leaderboard";
import NewsCard from "@/components/landing/news-card";
import { Suspense } from "react";

export default async function Home() {
  const user = (await getUserFromCookies())!;
  return (
    <main className="flex flex-col items-center py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold text-center mb-8">Your Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* News Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
              <Newspaper className="h-5 w-5" />
              News
            </h2>

            <NewsCard icon={MessageCircleWarning} title="New Login System">
              <p>
                We&apos;ve migrated to a new login system with improved
                password reset and Two-Factor Authentication support.
              </p>
            </NewsCard>

            <NewsCard icon={BarChart3} title="2025 Scores Finalized">
              <p className="mb-2">
                2025 is over, and you can now see the final scores!
              </p>
              <div className="flex gap-2 flex-wrap justify-center">
                <Button asChild variant="outline" size="sm" className="min-w-[75%]">
                  <Link href="/competitions/2/scores">
                    <Trophy className="h-3 w-3 mr-1" />
                    Leaderboard
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="min-w-[75%]">
                  <Link href={`/competitions/2/scores/user/${user.id}`}>
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Your Score Breakdown
                  </Link>
                </Button>
              </div>
            </NewsCard>
          </div>

          {/* 2026 Standings Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
              <Medal className="h-5 w-5" />
              2026 Standings
            </h2>
            <Suspense
              fallback={
                <Card>
                  <CardContent className="py-6">
                    <p className="text-sm text-muted-foreground">
                      Loading standings...
                    </p>
                  </CardContent>
                </Card>
              }
            >
              <MiniLeaderboard competitionId={3} />
            </Suspense>
          </div>

          {/* Recently Resolved Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recently Resolved
            </h2>
            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
