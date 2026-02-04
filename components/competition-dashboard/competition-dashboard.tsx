"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { CompetitionHeader } from "./competition-header";
import { CompetitionTabs, type DashboardTab } from "./competition-tabs";
import { StatCards } from "./stat-cards";
import { UpcomingDeadlines } from "./upcoming-deadlines";
import { LeaderboardSidebar } from "./leaderboard-sidebar";
import { ForecastablePropsTable } from "@/components/forecastable-props-table";
import { PropsTable } from "@/components/props/props-table";
import Leaderboard from "@/components/scores/leaderboard";
import { MembersTable, InviteMemberDialog } from "@/components/members";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getCompetitionMembers } from "@/lib/db_actions/competition-members";
import type { CompetitionStats, UpcomingDeadline } from "@/lib/db_actions/competition-stats";
import type { CompetitionScore } from "@/lib/db_actions";
import type { Category, PropWithUserForecast, VCompetitionMember } from "@/types/db_types";

interface CompetitionDashboardProps {
  competitionId: number;
  competitionName: string;
  isPrivate: boolean;
  stats: CompetitionStats;
  upcomingDeadlines: UpcomingDeadline[];
  scores: CompetitionScore;
  categories: Category[];
  isAdmin: boolean;
  currentUserId: number;
  props: PropWithUserForecast[];
  memberCount?: number; // Only for private competitions
  userForecastCount: number;
}

export function CompetitionDashboard({
  competitionId,
  competitionName,
  isPrivate,
  stats,
  upcomingDeadlines,
  scores,
  categories,
  isAdmin,
  currentUserId,
  props,
  memberCount,
  userForecastCount,
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

  // Helper to get the effective close date for a prop
  // Private competitions use per-prop dates, public use competition-level dates
  const getCloseDate = useCallback(
    (prop: PropWithUserForecast): Date | null => {
      return isPrivate
        ? prop.prop_forecasts_due_date
        : prop.competition_forecasts_close_date;
    },
    [isPrivate],
  );

  const openProps = useMemo(() => {
    return props.filter((prop) => {
      // Open: close date is in the future (or null for no deadline)
      const closeDate = getCloseDate(prop);
      return closeDate === null || new Date(closeDate) > now;
    });
  }, [props, now, getCloseDate]);

  const closedProps = useMemo(() => {
    return props.filter((prop) => {
      // Closed: close date is in the past AND not resolved
      const closeDate = getCloseDate(prop);
      const isResolved = prop.resolution !== null;
      return closeDate !== null && new Date(closeDate) <= now && !isResolved;
    });
  }, [props, now, getCloseDate]);

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

  // Show members tab for all private competition members
  const showMembersTab = isPrivate;

  // Members tab state — fetch members when the tab is active
  const [members, setMembers] = useState<VCompetitionMember[] | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [isLoadingMembers, startLoadingMembers] = useTransition();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [membersRefreshKey, setMembersRefreshKey] = useState(0);
  const refreshMembers = useCallback(() => {
    setMembersRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (activeTab !== "members" || !isPrivate) return;
    setMembersError(null);
    startLoadingMembers(async () => {
      const result = await getCompetitionMembers(competitionId);
      if (result.success) {
        setMembers(result.data);
      } else {
        setMembersError(result.error);
      }
    });
  }, [activeTab, isPrivate, competitionId, membersRefreshKey]);

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
              <div className="max-w-3xl mx-auto">
                <Leaderboard
                  scores={scores}
                  categories={categories}
                  competitionId={competitionId}
                  currentUserId={currentUserId}
                  userForecastCount={userForecastCount}
                />
              </div>
            )}
            {activeTab === "members" && showMembersTab && (
              <div className="max-w-3xl mx-auto space-y-6">
                {isAdmin && (
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">
                      Manage who has access to this competition.
                    </p>
                    <Button onClick={() => setShowInviteDialog(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                )}
                {membersError ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-destructive">{membersError}</p>
                  </div>
                ) : isLoadingMembers || members === null ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner className="h-6 w-6" />
                  </div>
                ) : (
                  <MembersTable
                    members={members}
                    competitionId={competitionId}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    onMemberChange={refreshMembers}
                  />
                )}
                {isAdmin && (
                  <InviteMemberDialog
                    competitionId={competitionId}
                    isOpen={showInviteDialog}
                    onClose={() => setShowInviteDialog(false)}
                    onMemberChange={refreshMembers}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
