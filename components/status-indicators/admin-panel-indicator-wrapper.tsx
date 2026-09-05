import { getUserFromCookies } from "@/lib/get-user";
import { AdminPanelIndicator } from "./admin-panel-indicator";

export async function AdminPanelIndicatorWrapper() {
  const user = await getUserFromCookies();

  if (!user?.is_admin) {
    return null;
  }

  return <AdminPanelIndicator />;
}
