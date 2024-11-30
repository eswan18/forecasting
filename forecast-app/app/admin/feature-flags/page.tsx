import PageHeading from "@/components/page-heading";
import { getFeatureFlags } from "@/lib/db_actions";
import { getUserFromCookies } from "@/lib/get-user";
import { VFeatureFlag } from "@/types/db_types";
import { FeatureWidget } from "./feature-widget";
import { loginAndRedirect } from "@/lib/get-user";

export default async function FeatureFlagsPage() {
  const user = await getUserFromCookies();
  if (!user) {
    await loginAndRedirect({ url: "/feature-flags" })
    return <></>; // will never reach this line because we redirect.
  };
  if (!user.is_admin) throw new Error("Unauthorized");
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
