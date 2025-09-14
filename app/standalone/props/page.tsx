import { getPropsWithUserForecasts } from "@/lib/db_actions/forecasts";
import { getUserFromCookies } from "@/lib/get-user";
import { PropsTable } from "@/app/competitions/[competitionId]/props/props-table";

export default async function Page() {
  const user = await getUserFromCookies();
  const allowEdits = user?.is_admin || false;

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
      allowEdits={true} // All users can create/edit standalone props
      competitionId={null} // null for standalone props
    />
  );
}
