import { getUserFromCookies } from "@/lib/get-user";
import { SignedOutLanding } from "@/components/signed-out-landing";
import {
  RisoDashboard,
  type DashboardLayout,
} from "@/components/dashboard/riso-dashboard";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ layout?: string }>;
}) {
  const user = await getUserFromCookies();
  // "/" is the front door: visitors without a session get the landing page,
  // everyone signed in gets their dashboard.
  if (!user) {
    return <SignedOutLanding />;
  }

  // Temporary, while we pick a Your Competitions layout: ?layout=a shows the
  // ledger, anything else shows position-first.
  const { layout } = await searchParams;
  const variant: DashboardLayout = layout === "a" ? "a" : "c";

  return <RisoDashboard user={user} layout={variant} />;
}
