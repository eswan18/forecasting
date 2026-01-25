"use client";

import { cn } from "@/lib/utils";

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
        "bg-card border rounded-lg p-4 text-left transition-all",
        onClick && "hover:shadow-md cursor-pointer",
        active
          ? "border-primary ring-2 ring-primary/20"
          : "border-border",
      )}
    >
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      {sublabel && (
        <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>
      )}
    </Component>
  );
}

interface StatCardsProps {
  toForecast: number;
  closed: number;
  resolved: number;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
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
