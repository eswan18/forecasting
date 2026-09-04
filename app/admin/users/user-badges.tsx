/**
 * The two marks an account can carry, shared by the roster and the account
 * sheet so both print the same word for the same fact.
 *
 * Print marks the exception and leaves the rule silent: almost every account
 * is an active forecaster, so those rows carry nothing at all. A pill on every
 * row would be a filled surface saying "normal" five times a page, and the
 * reader would have to read all of them to find the one that is not.
 */
export const userMarksCss = `
.hxp .mark {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  white-space: nowrap;
}
.hxp .mark + .mark { margin-left: 0.875rem; }
`;

/** Prints for an admin and stays silent for everyone else. */
export function UserRoleMark({ isAdmin }: { isAdmin: boolean }) {
  if (!isAdmin) return null;
  return <span className="mark">Admin</span>;
}

/**
 * Prints for a closed account and stays silent for a live one.
 *
 * Deactivated is a state, not an alarm: it is set in the same muted mono caps
 * as every other small label, and the row it belongs to greys its own name.
 * Red on this page means the reader, not a disabled login.
 */
export function UserAccessMark({ active }: { active: boolean }) {
  if (active) return null;
  return <span className="mark">Deactivated</span>;
}
