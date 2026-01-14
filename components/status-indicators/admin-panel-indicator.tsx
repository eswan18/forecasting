import { headers } from "next/headers";
import { getUserFromCookies } from "@/lib/get-user";
import { StatusIndicator } from "./status-indicator";

export async function AdminPanelIndicator() {
  // Get the current pathname from headers
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Only show on admin routes
  if (!pathname.startsWith("/admin")) {
    return null;
  }

  // Check if user is admin
  const user = await getUserFromCookies();
  if (!user?.is_admin) {
    return null;
  }

  return <StatusIndicator variant="accent">Admin Panel</StatusIndicator>;
}
