import PageHeading from "@/components/page-heading";
import {
  getForecasts,
  getUnforecastedProps,
  hasFeatureEnabled,
} from "@/lib/db_actions";
import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";
import Link from "next/link";

export default async function Home() {
  const user = await getUserFromCookies();
  if (!user) {
    await loginAndRedirect({ url: `/` });
    return <></>; // will never reach this line due to redirect.
  }
  // Does the user have 2025 props to forecast?
  const unforecastedProps = await getUnforecastedProps({
    userId: user.id,
    year: 2025,
  });
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Welcome!" />
        Quick Links:
        <ul className="list-disc px-4">
          <li className="underline">
            <Link href={`/forecasts/2024/user/${user.id}`}>
              Your 2024 Forecasts
            </Link>
          </li>
          <li className="underline">
            <Link href="/scores/2024">2024 Scores</Link>
          </li>
        </ul>
        {unforecastedProps.length > 0 && (
          <div className="mt-5 text-lg">
            <p className="font-semibold">
              You have 2025 forecasts to do!
            </p>
            <p>
              <Link href={`/forecasts/record/2025`} className="underline">
                Click here
              </Link>{" "}
              to record them.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
