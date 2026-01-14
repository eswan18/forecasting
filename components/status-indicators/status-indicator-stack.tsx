import { EnvironmentIndicator } from "./environment-indicator";
import { ImpersonationIndicatorWrapper } from "./impersonation-indicator-wrapper";
import { AdminPanelIndicator } from "./admin-panel-indicator";

/**
 * StatusIndicatorStack renders all status indicators at the very top of the page.
 *
 * Indicators are displayed in a consistent order:
 * 1. Environment indicator (local/dev mode)
 * 2. Impersonation indicator (when admin is viewing as another user)
 * 3. Admin panel indicator (when on admin routes)
 *
 * The stack is positioned above the navbar. Each indicator handles its own
 * visibility logic internally.
 */
export function StatusIndicatorStack() {
  return (
    <div className="w-full">
      <EnvironmentIndicator />
      <ImpersonationIndicatorWrapper />
      <AdminPanelIndicator />
    </div>
  );
}
