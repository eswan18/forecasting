"use client";

import { cn } from "@/lib/utils";
import type { DashboardTab } from "./competition-tabs";

interface StatCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  onClick?: () => void;
  active?: boolean;
}

export function StatCard({
  label,
  value,
  sublabel,
  onClick,
  active,
}: StatCardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border bg-card p-4 text-left transition-colors",
        onClick && "cursor-pointer hover:border-foreground/20",
        active && "border-primary/60 bg-primary/[0.03]",
      )}
    >
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </span>
      {sublabel && (
        <span className="text-xs text-muted-foreground">{sublabel}</span>
      )}
    </Component>
  );
}

interface StatCardsProps {
  toForecast: number;
  closed: number;
  resolved: number;
  onTabChange?: (tab: DashboardTab) => void;
  activeTab?: DashboardTab;
}

export function StatCards({
  toForecast,
  closed,
  resolved,
  onTabChange,
  activeTab,
}: StatCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        label="To Forecast"
        value={toForecast}
        sublabel="Props need your prediction"
        onClick={onTabChange ? () => onTabChange("open") : undefined}
        active={activeTab === "open"}
      />
      <StatCard
        label="Closed"
        value={closed}
        sublabel="Awaiting resolution"
        onClick={onTabChange ? () => onTabChange("closed") : undefined}
        active={activeTab === "closed"}
      />
      <StatCard
        label="Resolved"
        value={resolved}
        sublabel="Scored props"
        onClick={onTabChange ? () => onTabChange("resolved") : undefined}
        active={activeTab === "resolved"}
      />
    </div>
  );
}
