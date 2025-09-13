import { getCurrentEnvironment } from "@/lib/environment";

export function EnvironmentBanner() {
  const env = getCurrentEnvironment();

  // Only show badge for non-production environments
  if (env === "prod") {
    return null;
  }

  const getBarColor = (env: string) => {
    switch (env) {
      case "local":
        return "bg-blue-500";
      case "dev":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={`${getBarColor(env)} text-white text-center text-xs font-medium py-1 w-full`}
    >
      {env.toUpperCase()} ENVIRONMENT
    </div>
  );
}
