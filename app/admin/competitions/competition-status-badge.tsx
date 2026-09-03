import { CompetitionStatus } from "@/lib/competition-status";

/**
 * Where a competition is in its life, printed as a marker beside its name.
 *
 * A filled pill was the only tinted surface on the page and it coloured five
 * states in three greys, which said nothing. Print marks the exception instead:
 * the one competition still taking forecasts sets in ink, the rest are record
 * and set faint. Red is not available here — it means "you" or "this failed".
 */
export const statusCss = `
.hxp .st {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-faint);
  white-space: nowrap;
}
.hxp .st.live { color: var(--ink); }
`;

/**
 * The same five words the public list groups its seasons under, so a reader
 * moving between the two pages is reading one vocabulary.
 */
const LABELS: Record<CompetitionStatus, string> = {
  upcoming: "Upcoming",
  "forecasts-open": "Open",
  "forecasts-closed": "Scoring",
  ended: "Final",
  private: "Private",
};

interface CompetitionStatusBadgeProps {
  status: CompetitionStatus;
}

export function CompetitionStatusBadge({
  status,
}: CompetitionStatusBadgeProps) {
  return (
    <span className={status === "forecasts-open" ? "st live" : "st"}>
      {LABELS[status]}
    </span>
  );
}
