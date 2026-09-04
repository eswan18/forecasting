import { getUserFromCookies } from "@/lib/get-user";
import { SignedOutLanding } from "@/components/signed-out-landing";
import { RisoDashboard } from "@/components/dashboard/riso-dashboard";
import { wantsAll } from "@/components/dashboard/visible-seasons";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getUserFromCookies();
  // "/" is the front door: visitors without a session get the landing page,
  // everyone signed in gets their dashboard.
  if (!user) {
    return <SignedOutLanding />;
  }

  const params = await searchParams;
  return <RisoDashboard user={user} showAll={wantsAll(params)} />;
}
