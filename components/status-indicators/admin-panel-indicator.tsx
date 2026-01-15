"use client";

import { usePathname } from "next/navigation";
import { StatusIndicator } from "./status-indicator";

export function AdminPanelIndicator() {
  const pathname = usePathname();

  // Only show on admin routes
  if (!pathname.startsWith("/admin")) {
    return null;
  }

  return <StatusIndicator variant="accent">Admin Panel</StatusIndicator>;
}
