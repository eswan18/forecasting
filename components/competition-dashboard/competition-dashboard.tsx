"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompetitionHeader } from "./competition-header";
import { CompetitionTabs, type DashboardTab } from "./competition-tabs";
import { StatCards } from "./stat-cards";
import { UpcomingDeadlines } from "./upcoming-deadlines";
import { LeaderboardSidebar } from "./leaderboard-sidebar";
import { ForecastablePropsTable } from "@/components/forecastable-props-table";
import { PropsTable } from "@/components/props/props-table";
import type { CompetitionStats, UpcomingDeadline } from "@/lib/db_actions/competition-stats";
import type { CompetitionScore } from "@/lib/db_actions";
import type { PropWithUserForecast } from "@/types/db_types";

interface CompetitionDashboardProps {
  competitionId: number;
  competitionName: string;
  isPrivate: boolean;
  stats: CompetitionStats;
  upcomingDeadlines: UpcomingDeadline[];
  scores: CompetitionScore;
  isAdmin: boolean;
  currentUserId: number;
  props: PropWithUserForecast[];
  memberCount?: number; // Only for private competitions
}

export function CompetitionDashboard({
  competitionId,
  competitionName,
  isPrivate,
  stats,
  upcomingDeadlines,
  scores,
  isAdmin,
  currentUserId,
  props,
  memberCount,
}: CompetitionDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get active tab from URL query params
  const tabParam = searchParams.get("tab");
  const activeTab: DashboardTab =
    tabParam === "open" ||
    tabParam === "closed" ||
    tabParam === "resolved" ||
    tabParam === "leaderboard" ||
    tabParam === "members"
      ? tabParam
      : "overview";

  // Filter props based on tab
  const now = new Date();

  const openProps = useMemo(() => {
    return props.filter((prop) => {
      // Open: forecasts_due_date is in the future (or null for no deadline)
      const dueDate = prop.prop_forecasts_due_date;
      return dueDate === null || new Date(dueDate) > now;
    });
  }, [props, now]);

  const closedProps = useMemo(() => {
    return props.filter((prop) => {
      // Closed: forecasts_due_date is in the past AND not resolved
      const dueDate = prop.prop_forecasts_due_date;
      const isResolved = prop.resolution !== null;
      return dueDate !== null && new Date(dueDate) <= now && !isResolved;
    });
  }, [props, now]);

  const resolvedProps = useMemo(() => {
    return props.filter((prop) => prop.resolution !== null);
  }, [props]);

  const handleTabChange = useCallback(
    (tab: DashboardTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const queryString = params.toString();
      router.push(
        `/competitions/${competitionId}${queryString ? `?${queryString}` : ""}`,
      );
    },
    [competitionId, router, searchParams],
  );

  const handleAddProp = useCallback(() => {
    router.push(`/competitions/${competitionId}/props/new`);
  }, [competitionId, router]);

  // Show overview dashboard content or tab-specific content
  const showOverview = activeTab === "overview";

  // Calculate forecaster count from scores for public competitions
  const forecasterCount = scores.overallScores?.length ?? 0;

  // Show members tab only for private competitions where user is admin
  const showMembersTab = isPrivate && isAdmin;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <CompetitionHeader
            competitionId={competitionId}
            competitionName={competitionName}
            isPrivate={isPrivate}
            isAdmin={isAdmin}
            memberCount={memberCount}
            forecasterCount={forecasterCount}
            onAddProp={isAdmin ? handleAddProp : undefined}
          />

          {/* Tabs */}
          <CompetitionTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            stats={{
              toForecast: stats.toForecast,
              closed: stats.closed,
              resolved: stats.resolved,
            }}
            showMembersTab={showMembersTab}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {showOverview ? (
          <div className="flex gap-6">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Stats row */}
              <div className="mb-6">
                <StatCards
                  toForecast={stats.toForecast}
                  closed={stats.closed}
                  resolved={stats.resolved}
                  onTabChange={handleTabChange}
                  activeTab={activeTab}
                />
              </div>

              {/* Upcoming deadlines */}
              <UpcomingDeadlines
                deadlines={upcomingDeadlines}
                competitionId={competitionId}
                onViewAll={() => handleTabChange("open")}
              />
            </div>

            {/* Sidebar - Leaderboard */}
            <div className="w-72 shrink-0 hidden lg:block">
              <LeaderboardSidebar
                scores={scores}
                competitionId={competitionId}
                currentUserId={currentUserId}
              />
            </div>
          </div>
        ) : (
          // Tab-specific content
          <div>
            {activeTab === "open" && (
              <ForecastablePropsTable
                props={openProps}
                canCreateProps={isAdmin}
                competitionId={competitionId}
              />
            )}
            {activeTab === "closed" && (
              <PropsTable
                props={closedProps}
                canCreateProps={false}
                competitionId={competitionId}
                showCommunityAvg={true}
              />
            )}
            {activeTab === "resolved" && (
              <PropsTable
                props={resolvedProps}
                canCreateProps={false}
                competitionId={competitionId}
                showCommunityAvg={true}
              />
            )}
            {activeTab === "leaderboard" && (
              <div className="max-w-md">
                <LeaderboardSidebar
                  scores={scores}
                  competitionId={competitionId}
                  currentUserId={currentUserId}
                  maxEntries={100}
                />
              </div>
            )}
            {activeTab === "members" && showMembersTab && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  View and manage competition members
                </p>
                <button
                  onClick={() => router.push(`/competitions/${competitionId}/members`)}
                  className="text-primary hover:underline"
                >
                  Go to Members Page →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
