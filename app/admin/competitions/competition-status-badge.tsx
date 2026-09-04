import {
  CompetitionStamp,
  seasonStateOf,
} from "@/components/competition-stamp/competition-stamp";
import { CompetitionStatus } from "@/lib/competition-status";

/**
 * Where a competition is in its life, printed beside its name.
 *
 * The same stamp the public pages use, so an admin moving between the two is
 * reading one vocabulary. Privacy is not a lifecycle state — a private
 * competition takes forecasts off per-prop dates and so stamps `Open` — so it
 * is marked separately, the way the public list marks it.
 */
export const statusCss = `
.hxp .lock {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-faint);
}
`;

interface CompetitionStatusBadgeProps {
  status: CompetitionStatus;
}

export function CompetitionStatusBadge({
  status,
}: CompetitionStatusBadgeProps) {
  return (
    <>
      <CompetitionStamp state={seasonStateOf(status)} />
      {status === "private" && <span className="lock">private</span>}
    </>
  );
}
