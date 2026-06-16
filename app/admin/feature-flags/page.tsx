import PageHeading from "@/components/page-heading";
import { getFeatureFlags } from "@/lib/db_actions";
import { VFeatureFlag } from "@/types/db_types";
import { FeatureWidget } from "./feature-widget";
import { Container } from "@/components/ui/container";

export default async function FeatureFlagsPage() {
  const result = await getFeatureFlags();
  if (!result.success) {
    return (
      <main className="py-10 lg:py-14">
        <Container className="max-w-3xl">
          <PageHeading title="Feature Flags" breadcrumbs={{ Admin: "/admin" }} />
          <p className="text-sm text-destructive">Error: {result.error}</p>
        </Container>
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
    <main className="py-10 lg:py-14">
      <Container className="max-w-3xl">
        <PageHeading
          title="Feature Flags"
          subtitle="Toggle features globally or for individual users."
          breadcrumbs={{ Admin: "/admin" }}
        />
        {featureNames.length === 0 ? (
          <div className="rounded-lg border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No feature flags defined.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {featureNames.map((name) => (
              <FeatureWidget
                key={name}
                featureName={name}
                flags={featureFlagsByName.get(name)!}
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
