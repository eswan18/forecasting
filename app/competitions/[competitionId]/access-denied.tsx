import ErrorPage from "@/components/pages/error-page";
import { InaccessiblePage } from "@/components/inaccessible-page";
import type { CompetitionAccess } from "./access";

/** Renders whichever refusal `competitionAccess` returned. */
export function AccessDenied({
  access,
}: {
  access: Extract<CompetitionAccess, { ok: false }>;
}) {
  if (access.kind === "error") {
    return <ErrorPage title={access.title} />;
  }
  return <InaccessiblePage title={access.title} message={access.message} />;
}
