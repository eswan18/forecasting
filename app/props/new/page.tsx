import { NewPropForm } from "@/components/forms/new-prop-form";
import { InaccessiblePage } from "@/components/inaccessible-page";
import ErrorPage from "@/components/pages/error-page";
import { getCategories } from "@/lib/db_actions/categories";
import { hasFeatureEnabled } from "@/lib/db_actions/feature_flags";
import { getUserFromCookies } from "@/lib/get-user";

export default async function NewPersonalPropPage() {
  const user = await getUserFromCookies();
  if (!user) {
    return (
      <InaccessiblePage
        title="Not signed in"
        message="You must be signed in to write a prop."
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

  const categoriesResult = await getCategories();
  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <NewPropForm
      target={{ kind: "personal" }}
      categories={categories}
      userId={user.id}
    />
  );
}
