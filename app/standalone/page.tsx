import { getPropsWithUserForecasts } from "@/lib/db_actions/forecasts";
import { getUserFromCookies, loginAndRedirect } from "@/lib/get-user";
import { PropsTable } from "@/components/props/props-table";
import PageHeading from "@/components/page-heading";
import { TrendingUpDown } from "lucide-react";

export default async function Page() {
  const user = await getUserFromCookies();

  if (!user) {
    await loginAndRedirect({ url: "/standalone/props" });
    return null;
  }

  const propsWithForecasts = await getPropsWithUserForecasts({
    userId: user.id,
    competitionId: null, // null means standalone props
  });

  return (
    <main className="flex flex-col items-start py-4 px-8 lg:py-8 lg:px-24 w-full">
      <PageHeading
        title="Standalone Forecasts"
        breadcrumbs={{
          Home: "/",
          "Standalone Forecasts": "/standalone",
        }}
        icon={TrendingUpDown}
        iconGradient="bg-gradient-to-br from-orange-500 to-red-600"
        className="mb-2"
      />
      <p className="text-muted-foreground mb-8">
        Forecasts not associated with a competition
      </p>
      <PropsTable
        props={propsWithForecasts}
        canCreateProps={true} // All users can create standalone props
        canEditProps={true} // All users can edit standalone props
        canEditResolutions={user.is_admin} // Only admins can resolve props
        competitionId={null} // null for standalone props
        defaultUserId={user.id} // Pass user ID for personal props
      />
    </main>
  );
}
