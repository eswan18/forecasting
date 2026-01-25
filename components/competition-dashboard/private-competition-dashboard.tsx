"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompetitionHeader } from "./competition-header";
import { CompetitionTabs, type DashboardTab } from "./competition-tabs";
import { StatCards } from "./stat-cards";
import { UpcomingDeadlines } from "./upcoming-deadlines";
import { LeaderboardSidebar } from "./leaderboard-sidebar";
import type { CompetitionStats, UpcomingDeadline } from "@/lib/db_actions/competition-stats";
import type { CompetitionScore } from "@/lib/db_actions";

interface PrivateCompetitionDashboardProps {
  competitionId: number;
  competitionName: string;
  stats: CompetitionStats;
  upcomingDeadlines: UpcomingDeadline[];
  scores: CompetitionScore;
  memberCount: number;
  isAdmin: boolean;
  currentUserId: number;
  /** Content to render for the current tab (passed from server) */
  tabContent?: React.ReactNode;
}

export function PrivateCompetitionDashboard({
  competitionId,
  competitionName,
  stats,
  upcomingDeadlines,
  scores,
  memberCount,
  isAdmin,
  currentUserId,
  tabContent,
}: PrivateCompetitionDashboardProps) {
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
    // Navigate to add prop page or open dialog
    router.push(`/competitions/${competitionId}/props/new`);
  }, [competitionId, router]);

  // Show overview dashboard content or tab-specific content
  const showOverview = activeTab === "overview";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <CompetitionHeader
            competitionId={competitionId}
            competitionName={competitionName}
            memberCount={memberCount}
            isAdmin={isAdmin}
            onAddProp={handleAddProp}
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
            isAdmin={isAdmin}
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
          // Tab-specific content passed from server
          <div>{tabContent}</div>
        )}
      </div>
    </div>
  );
}
