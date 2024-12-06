import PageHeading from "@/components/page-heading";
import { getFeatureFlags } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { VFeatureFlag } from "@/types/db_types";
import { FeatureWidget } from "./feature-widget";
import { InaccessiblePage } from "@/components/inaccessible-page";

export default async function FeatureFlagsPage() {
  const user = await getUserFromCookies();
  if (!user?.is_admin) {
    return (
      <InaccessiblePage
        title="No access"
        message="Only admins can see this page."
      />
    );
  }
  const featureFlags = await getFeatureFlags();
  // Group the feature flags by name.
  const featureFlagsByName = new Map<string, VFeatureFlag[]>();
  for (const featureFlag of featureFlags) {
    if (!featureFlagsByName.has(featureFlag.name)) {
      featureFlagsByName.set(featureFlag.name, []);
    }
    featureFlagsByName.get(featureFlag.name)!.push(featureFlag);
  }
  const featureNames = Array.from(featureFlagsByName.keys());
  featureNames.sort();
  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-lg flex flex-col">
        <PageHeading title="Feature Flags" />
        <div className="flex flex-col gap-2">
          {featureNames.map((name) => (
            <FeatureWidget
              key={name}
              featureName={name}
              flags={featureFlagsByName.get(name)!}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
