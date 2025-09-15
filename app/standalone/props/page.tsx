import { getPropsWithUserForecasts } from "@/lib/db_actions/forecasts";
import { getUserFromCookies } from "@/lib/get-user";
import { PropsTable } from "@/components/props/props-table";

export default async function Page() {
  const user = await getUserFromCookies();

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  const propsWithForecasts = await getPropsWithUserForecasts({
    userId: user.id,
    competitionId: null, // null means standalone props
  });

  return (
    <PropsTable
      props={propsWithForecasts}
      canCreateProps={true} // All users can create standalone props
      canEditProps={true} // All users can edit standalone props
      canEditResolutions={user.is_admin} // Only admins can resolve props
      competitionId={null} // null for standalone props
      defaultUserId={user.id} // Pass user ID for personal props
    />
  );
}
