import { getImpersonatingAdmin, getUserFromCookies } from "@/lib/get-user";
import { ImpersonationBanner } from "./impersonation-banner";

export async function ImpersonationBannerWrapper() {
  const [impersonatingAdmin, currentUser] = await Promise.all([
    getImpersonatingAdmin(),
    getUserFromCookies(),
  ]);

  // Only show banner if an admin is impersonating
  if (!impersonatingAdmin || !currentUser) {
    return null;
  }

  return (
    <ImpersonationBanner
      impersonatedUsername={currentUser.username || ""}
      impersonatedName={currentUser.name || ""}
    />
  );
}
