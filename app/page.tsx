import PageHeading from "@/components/page-heading";
import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, BarChart3, Lightbulb, Calendar } from "lucide-react";

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* 2025 Current Competition */}
            <Card className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    2025 Open Competition
                  </CardTitle>
                  <Badge variant="default" className="ml-auto">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View leaderboard and check our our new{" "}
                  <span className="italic">Score Breakdown</span> feature.
                </p>
              </CardContent>
              <CardFooter className="mt-auto">
                <div className="flex gap-x-2 w-full justify-center">
                  <Button asChild variant="ghost">
                    <Link href="/competitions/2/scores">
                      <Trophy className="h-4 w-4 mr-2" />
                      Leaderboard
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href={`/competitions/2/scores/user/${user.id}`}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Your Score Breakdown
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
            {/* 2026 Suggestions */}
            <Card className="hover:shadow-md transition-shadow flex flex-col">
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
                <p className="text-muted-foreground">
                  We&apos;re in the second half of the year, and it&apos;s time
                  to start thinking about next year&apos;s propositions. Your
                  suggestions help shape the competition!
                </p>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/props/suggest">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Suggest New Props
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
