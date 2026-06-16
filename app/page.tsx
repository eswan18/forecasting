import { getUserFromCookies } from "@/lib/get-user";
import { Trophy, BarChart3, MessageCircleWarning } from "lucide-react";
import MiniLeaderboard from "@/components/landing/mini-leaderboard";
import NewsCard from "@/components/landing/news-card";
import IconLinkButton from "@/components/landing/icon-link-button";
import RecentlyResolved from "@/components/landing/recently-resolved";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Suspense } from "react";

function PanelSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex flex-col gap-3">
        {[...Array(lines).keys()].map((i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default async function Home() {
  const user = (await getUserFromCookies())!;
  return (
    <main className="py-10 lg:py-14">
      <Container>
        <header className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your news, standings, and recent resolutions at a glance.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {/* News */}
          <section className="flex flex-col gap-4 motion-safe:animate-fade-in-up">
            <SectionHeader kicker="News" />
            <NewsCard icon={MessageCircleWarning} title="New Login System">
              <p>
                We&apos;ve migrated to a new login system with improved password
                reset and Two-Factor Authentication support.
              </p>
            </NewsCard>

            <NewsCard
              icon={BarChart3}
              title="2025 Scores Finalized"
              buttons={
                <>
                  <IconLinkButton
                    icon={Trophy}
                    href="/competitions/2?tab=leaderboard"
                  >
                    Leaderboard
                  </IconLinkButton>
                  <IconLinkButton
                    icon={BarChart3}
                    href={`/competitions/2/scores/user/${user.id}`}
                  >
                    Your Score Breakdown
                  </IconLinkButton>
                </>
              }
            >
              <p>2025 is over, and you can now see the final scores!</p>
            </NewsCard>
          </section>

          {/* 2026 Standings */}
          <section className="flex flex-col gap-4 motion-safe:animate-fade-in-up motion-safe:[animation-delay:120ms]">
            <SectionHeader kicker="2026 Standings" />
            <Suspense fallback={<PanelSkeleton lines={5} />}>
              {/* Competition ID 6 = 2026 */}
              <MiniLeaderboard competitionId={6} />
            </Suspense>
          </section>

          {/* Recently Resolved */}
          <section className="flex flex-col gap-4 motion-safe:animate-fade-in-up motion-safe:[animation-delay:240ms]">
            <SectionHeader kicker="Recently Resolved" />
            <Suspense fallback={<PanelSkeleton lines={3} />}>
              <RecentlyResolved userId={user.id} />
            </Suspense>
          </section>
        </div>
      </Container>
    </main>
  );
}
