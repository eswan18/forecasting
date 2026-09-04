import { getFeatureFlags } from "@/lib/db_actions";

import { FeatureFlagsSheet } from "./feature-widget";

export default async function FeatureFlagsPage() {
  const result = await getFeatureFlags();
  return (
    <FeatureFlagsSheet
      flags={result.success ? result.data : []}
      error={result.success ? null : result.error}
    />
  );
}
