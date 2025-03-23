import PageHeading from "@/components/page-heading";
import { getSuggestedProps } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { InaccessiblePage } from "@/components/inaccessible-page";

export default async function SuggestedProps() {
  const user = await getUserFromCookies();
  const authorized = user?.is_admin;
  if (!authorized) {
    return (
      <InaccessiblePage
        title="No access"
        message="Only admins can see this page."
      />
    );
  }
  const suggestedProps = await getSuggestedProps();
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg">
        <PageHeading title="Suggested Props" />
        <ul className="flex flex-col gap-4">
          {suggestedProps.map((prop) => (
            <li key={prop.id} className="flex flex-col gap-0.5">
              <div className="text-sm">
                {prop.user_username} ({prop.user_name})
              </div>
              <div>{prop.prop_text}</div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
