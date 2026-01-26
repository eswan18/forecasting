"use client";

import { cn } from "@/lib/utils";

interface TabButtonProps {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  count?: number;
}

function TabButton({ active, children, onClick, count }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "ml-1.5 px-1.5 py-0.5 rounded text-xs",
            active
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export type DashboardTab =
  | "overview"
  | "open"
  | "closed"
  | "resolved"
  | "leaderboard"
  | "members";

interface CompetitionTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  stats: {
    toForecast: number;
    closed: number;
    resolved: number;
  };
  showMembersTab: boolean;
}

export function CompetitionTabs({
  activeTab,
  onTabChange,
  stats,
  showMembersTab,
}: CompetitionTabsProps) {
  return (
    <div className="flex gap-1 -mb-px overflow-x-auto">
      <TabButton
        active={activeTab === "overview"}
        onClick={() => onTabChange("overview")}
      >
        Overview
      </TabButton>
      <TabButton
        active={activeTab === "open"}
        onClick={() => onTabChange("open")}
        count={stats.toForecast}
      >
        Open
      </TabButton>
      <TabButton
        active={activeTab === "closed"}
        onClick={() => onTabChange("closed")}
        count={stats.closed}
      >
        Closed
      </TabButton>
      <TabButton
        active={activeTab === "resolved"}
        onClick={() => onTabChange("resolved")}
        count={stats.resolved}
      >
        Resolved
      </TabButton>
      <TabButton
        active={activeTab === "leaderboard"}
        onClick={() => onTabChange("leaderboard")}
      >
        Leaderboard
      </TabButton>
      {showMembersTab && (
        <TabButton
          active={activeTab === "members"}
          onClick={() => onTabChange("members")}
        >
          Members
        </TabButton>
      )}
    </div>
  );
}
