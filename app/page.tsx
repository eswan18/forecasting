import PageHeading from "@/components/page-heading";
import { getUserFromCookies } from "@/lib/get-user";
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
import {
  Trophy,
  BarChart3,
  Calendar,
  MessageCircleWarning,
} from "lucide-react";

export default async function Home() {
  const user = (await getUserFromCookies())!;
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <PageHeading title="News & Updates" icon={Calendar} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* 2025 Current Competition */}
          <Card className="hover:shadow-md transition-shadow flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">2025 Open</CardTitle>
                <Badge variant="default" className="ml-auto">
                  Scores Finalized
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                2025 is over, and you can now see the final scores!
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
          {/* 2026 Forecasts */}
          <Card className="hover:shadow-md transition-shadow flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircleWarning className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg text-foreground">
                  New Login System
                </CardTitle>
                <Badge variant="default" className="ml-auto">
                  New Feature
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">
                We've migrated to a new login system! This means <span className="font-semibold">you need to reset your password</span> on your first login.
              </p>
              <ul className="text-muted-foreground list-disc list-inside">
                <li>Our password reset flow is much more reliable</li>
                <li>We now support multifactor authentication</li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <div className="flex gap-x-2 w-full justify-center">
                <Button asChild variant="ghost">
                  <Link href="/competitions/6/scores">
                    <Trophy className="h-4 w-4 mr-2" />
                    Leaderboard
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/competitions/6/scores/user/${user.id}`}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Your Score Breakdown
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
