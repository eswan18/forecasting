import PageHeading from "@/components/page-heading";
import { UserProfile } from "./user-profile";
import { getUserFromCookies } from "@/lib/auth";

export default async function Page() {
  const user = await getUserFromCookies();
  if (!user) {
    return null;
  }
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg flex flex-col">
        <PageHeading title="Account & Settings" />
        <UserProfile initialUserDetails={user} />
      </div>
    </main>
  );
}