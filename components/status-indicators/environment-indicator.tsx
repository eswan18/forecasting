import { getCurrentEnvironment } from "@/lib/environment";
import { StatusIndicator } from "./status-indicator";

export function EnvironmentIndicator() {
  const env = getCurrentEnvironment();

  // Only show banner for non-production environments
  if (env === "prod" || process.env.VERCEL === "1") {
    return null;
  }

  // This only renders outside production, so every environment it can show is
  // one you could mistake for production. They all get the second ink; the
  // word tells you which.
  return (
    <StatusIndicator variant="warning">
      {env.toUpperCase()} ENVIRONMENT
    </StatusIndicator>
  );
}
