"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
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
import { Container } from "@/components/ui/container";
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

  // Get active tab from URL query params.
  // "closed" is the pre-rename name for the "unresolved" tab; still honored so
  // older bookmarks and shared links land on the right tab.
  const rawTabParam = searchParams.get("tab");
  const tabParam = rawTabParam === "closed" ? "unresolved" : rawTabParam;
  const activeTab: DashboardTab =
    tabParam === "open" ||
    tabParam === "unresolved" ||
    tabParam === "resolved" ||
    tabParam === "leaderboard" ||
    tabParam === "members"
      ? tabParam
      : "overview";

  // Incomplete forecasters (those who haven't forecasted every prop) are hidden
  // by default — their partial-set Brier scores aren't comparable. Opt back in
  // with ?showIncomplete=1.
  const showIncomplete = searchParams.get("showIncomplete") === "1";

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

  // These filters are cheap and `now` is fresh on every render, so memoising
  // them bought nothing (the memo recomputed each render anyway).
  const openProps = props.filter((prop) => {
    // Open: close date is in the future (or null for no deadline)
    const closeDate = getCloseDate(prop);
    return closeDate === null || new Date(closeDate) > now;
  });

  const unresolvedProps = props.filter((prop) => {
    // Unresolved: close date is in the past AND not resolved
    const closeDate = getCloseDate(prop);
    // A resolved choice prop has a null `resolution`; `resolution_id` is
    // the "is resolved" flag for every kind.
    const isResolved = prop.resolution_id !== null;
    return closeDate !== null && new Date(closeDate) <= now && !isResolved;
  });

  const resolvedProps = props.filter((prop) => prop.resolution_id !== null);

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

  // `replace`, not `push`: flipping a filter shouldn't stack history entries,
  // and `scroll: false` keeps the page from jumping to the top on each toggle.
  const handleShowIncompleteChange = useCallback(
    (next: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) {
        params.set("showIncomplete", "1");
      } else {
        params.delete("showIncomplete");
      }
      const queryString = params.toString();
      router.replace(
        `/competitions/${competitionId}${queryString ? `?${queryString}` : ""}`,
        { scroll: false },
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
    startLoadingMembers(async () => {
      setMembersError(null);
      const result = await getCompetitionMembers(competitionId);
      if (result.success) {
        setMembers(result.data);
      } else {
        setMembersError(result.error);
      }
    });
  }, [activeTab, isPrivate, competitionId, membersRefreshKey]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-card">
        <Container className="pt-6">
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
          <div className="mt-4">
            <CompetitionTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              stats={{
                toForecast: stats.toForecast,
                unresolved: stats.unresolved,
                resolved: stats.resolved,
              }}
              showMembersTab={showMembersTab}
            />
          </div>
        </Container>
      </div>

      {/* Content */}
      <Container className="py-8">
        {showOverview ? (
          <div className="flex gap-6">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Stats row */}
              <div className="mb-6">
                <StatCards
                  toForecast={stats.toForecast}
                  unresolved={stats.unresolved}
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
                showIncomplete={showIncomplete}
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
            {activeTab === "unresolved" && (
              <PropsTable
                props={unresolvedProps}
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
                  showIncomplete={showIncomplete}
                  onShowIncompleteChange={handleShowIncompleteChange}
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
      </Container>
    </div>
  );
}
