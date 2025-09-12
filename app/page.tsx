import PageHeading from "@/components/page-heading";
import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  BarChart3,
  Lightbulb,
  Calendar,
  TrendingUp,
  Users,
  Target,
} from "lucide-react";

export default async function Home() {
  const user = await getUserFromCookies();
  if (!user) {
    await loginAndRedirect({ url: `/` });
    return <></>; // will never reach this line due to redirect.
  }
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <PageHeading title="Your Dashboard" />
        </div>

        {/* News & Updates */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            News & Updates
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 2024 Results */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    2024 Results Finalized
                  </CardTitle>
                  <Badge variant="secondary" className="ml-auto">
                    Completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  All propositions for 2024 have been resolved. Check out the
                  final scores and see how you performed!
                </p>
                <Button asChild className="w-full">
                  <Link href="/competitions/1/scores">
                    <Trophy className="h-4 w-4 mr-2" />
                    View 2024 Scores
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* 2025 Current Competition */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">2025 Competition</CardTitle>
                  <Badge variant="default" className="ml-auto">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  See the stats about everyone&apos;s 2025 forecasts and view (very early) rankings.
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/competitions/2/forecasts/overview">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Stats
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/competitions/2/scores">
                      <Trophy className="h-4 w-4 mr-2" />
                      Scores
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2026 Suggestions */}
          <Card className="hover:shadow-md transition-shadow border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg text-foreground">
                  Suggest 2026 Props
                </CardTitle>
                <Badge
                  variant="outline"
                  className="ml-auto border-primary/30 text-primary"
                >
                  Open Now
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We&apos;re in the second half of the year, and it&apos;s time to
                start thinking about next year&apos;s propositions. Your
                suggestions help shape the competition!
              </p>
              <Button asChild className="w-full">
                <Link href="/props/suggest">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Suggest New Props
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
