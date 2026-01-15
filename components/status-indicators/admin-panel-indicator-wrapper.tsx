import { getUserFromCookies } from "@/lib/get-user";
import { AdminPanelIndicator } from "./admin-panel-indicator";

export async function AdminPanelIndicatorWrapper() {
  const user = await getUserFromCookies();

  // Only render for admin users
  if (!user?.is_admin) {
    return null;
  }

  return <AdminPanelIndicator />;
}
