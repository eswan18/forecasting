import { getImpersonatingAdmin, getUserFromCookies } from "@/lib/get-user";
import { ImpersonationIndicator } from "./impersonation-indicator";

export async function ImpersonationIndicatorWrapper() {
  const [impersonatingAdmin, currentUser] = await Promise.all([
    getImpersonatingAdmin(),
    getUserFromCookies(),
  ]);

  // Only show banner if an admin is impersonating
  if (!impersonatingAdmin || !currentUser) {
    return null;
  }

  return <ImpersonationIndicator impersonatedName={currentUser.name || ""} />;
}
