import { InaccessiblePage } from "@/components/inaccessible-page";
import ErrorPage from "@/components/pages/error-page";
import { hasFeatureEnabled } from "@/lib/db_actions/feature_flags";
import { getPropsWithUserForecasts } from "@/lib/db_actions/forecasts";
import { getUserFromCookies } from "@/lib/get-user";

import { PersonalPropsPage } from "./personal-props-page";

/**
 * Props a reader wrote for themselves: no competition, no scoring, no audience.
 *
 * The list is every one of them, settled ones included, because this is the only
 * place they exist — a personal prop belongs to no season and so appears on no
 * competition page.
 */
export default async function PersonalProps() {
  const user = await getUserFromCookies();
  if (!user) {
    return (
      <InaccessiblePage
        title="Not signed in"
        message="You must be signed in to see your props."
      />
    );
  }

  const flag = await hasFeatureEnabled({
    featureName: "personal-props",
    userId: user.id,
  });
  if (!flag.success) {
    return <ErrorPage title={flag.error} />;
  }
  if (!flag.data) {
    return (
      <InaccessiblePage
        title="Not available"
        message="Personal props are not turned on for your account."
      />
    );
  }

  const result = await getPropsWithUserForecasts({
    userId: user.id,
    competitionId: null,
  });
  if (!result.success) {
    return <ErrorPage title={result.error} />;
  }

  return <PersonalPropsPage props={result.data} currentUserId={user.id} />;
}
