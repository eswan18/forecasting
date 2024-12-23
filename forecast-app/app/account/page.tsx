import PageHeading from "@/components/page-heading";
import { AccountDetails } from "./account-details";
import { getUserFromCookies } from "@/lib/get-user";

export default async function Page() {
  const user = await getUserFromCookies();
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg flex flex-col">
        <PageHeading title="Account & Settings" />
        {user ? <AccountDetails /> : <div>You&apos;re not logged in!</div>}
      </div>
    </main>
  );
}
