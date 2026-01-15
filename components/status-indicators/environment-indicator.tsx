import { getCurrentEnvironment } from "@/lib/environment";
import { StatusIndicator, StatusIndicatorVariant } from "./status-indicator";

export function EnvironmentIndicator() {
  const env = getCurrentEnvironment();

  // Only show banner for non-production environments
  if (env === "prod" || process.env.VERCEL === "1") {
    return null;
  }

  const getVariant = (env: string): StatusIndicatorVariant => {
    switch (env) {
      case "local":
        return "info";
      case "dev":
        return "warning";
      default:
        return "accent";
    }
  };

  return (
    <StatusIndicator variant={getVariant(env)}>
      {env.toUpperCase()} ENVIRONMENT
    </StatusIndicator>
  );
}
