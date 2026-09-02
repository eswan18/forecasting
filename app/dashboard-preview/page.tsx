import {
  DashboardView,
  type DashboardLayout,
} from "@/components/dashboard/dashboard-view";
import {
  standingsFixture,
  resolvedFixture,
} from "@/components/dashboard/dashboard-view.fixtures";

/**
 * Temporary: renders the dashboard from fixtures so both Your Competitions
 * layouts can be compared without a populated database. Delete once one is
 * chosen. Not in PUBLIC_ROUTES, so it stays behind the auth gate.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ layout?: string }>;
}) {
  const { layout } = await searchParams;
  const variant: DashboardLayout = layout === "a" ? "a" : "c";
  return (
    <DashboardView
      userName="You"
      standings={standingsFixture}
      resolved={resolvedFixture}
      layout={variant}
    />
  );
}
