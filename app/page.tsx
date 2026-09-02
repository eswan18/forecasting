import { getUserFromCookies } from "@/lib/get-user";
import { SignedOutLanding } from "@/components/signed-out-landing";
import { RisoDashboard } from "@/components/dashboard/riso-dashboard";

export default async function Home() {
  const user = await getUserFromCookies();
  // "/" is the front door: visitors without a session get the landing page,
  // everyone signed in gets their dashboard.
  if (!user) {
    return <SignedOutLanding />;
  }

  return <RisoDashboard user={user} />;
}
