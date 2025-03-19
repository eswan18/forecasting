import PageHeading from "@/components/page-heading";
import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";
import Link from "next/link";

export default async function Home() {
  const user = await getUserFromCookies();
  if (!user) {
    await loginAndRedirect({ url: `/` });
    return <></>; // will never reach this line due to redirect.
  }
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Your Dashboard" />
        <div className="flex flex-col gap-y-3">
          <h2 className="text-muted-foreground mb-3">News & Updates</h2>
          <div>
            <p className="font-semibold">
              2024 Scoring is finalized!
            </p>
            <p className="text-sm">
              All propositions for 2024 have been resolved, and scores can be
              found on the{" "}
              <Link href="/scores/2024" className="underline">
                2024 Scores page
              </Link>
              .
            </p>
          </div>
          <div>
            <p className="font-semibold">
              2025 Forecasts are locked in
            </p>
            <p className="text-sm">
              Check out the{" "}
              <Link href="/forecasts/2025" className="underline">
                Forecast Stats page
              </Link>{" "}
              to see an overview of your fellow forecasters&apos; predictions.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
