import PageHeading from "@/components/page-heading";
import { getFeatureFlags } from "@/lib/db_actions";
import { VFeatureFlag } from "@/types/db_types";
import { FeatureWidget } from "./feature-widget";

export default async function FeatureFlagsPage() {
  const result = await getFeatureFlags();
  if (!result.success) {
    return (
      <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24 max-w-4xl mx-auto">
        <div className="w-full flex flex-col">
          <p className="text-destructive">Error: {result.error}</p>
        </div>
      </main>
    );
  }
  const featureFlags = result.data;
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
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24 max-w-4xl mx-auto">
      <div className="w-full flex flex-col">
        <PageHeading
          title="Feature Flags"
          breadcrumbs={{
            Admin: "/admin",
          }}
        />
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
