"use client";

import { useState } from "react";

/**
 * The sheet's switch.
 *
 * Design note. A pill switch is the wrong object here: it would be the one
 * rounded, filled, animated thing on a page built entirely from square rules,
 * and it says nothing about which way is on until you have learned it. So the
 * control is made of the sheet's own material — two mono words sitting on one
 * continuous line, with the half of that line under the live state inked to
 * 2px and the dead half left as a 1px hairline. The same two weights that open
 * a section and separate a row also say which state a feature is in, and the
 * state is named in words rather than implied by a position.
 *
 * Both halves are real buttons carrying aria-pressed, which buys the third
 * state this page genuinely has: a feature with no default row at all is drawn
 * with neither word inked, and clicking either one creates the row with that
 * value. A single toggling button could not express "no value yet", and could
 * not create one in a single, obvious press.
 *
 * The active half's border grows upward rather than downward (its padding is
 * shortened by the same pixel), so the rule stays one unbroken line across the
 * control instead of stepping down under the live word.
 */
export const toggleCss = `
.hxp .flip {
  display: inline-grid;
  grid-template-columns: 2.75rem 2.75rem;
  gap: 0;
}
.hxp .flip .cell {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-faint);
  background: none;
  border: 0;
  border-bottom: 1px solid var(--rule);
  padding: 0 0 calc(0.3125rem + 1px);
  text-align: center;
  cursor: pointer;
}
.hxp .flip .cell[aria-pressed="true"] {
  color: var(--ink);
  font-weight: 700;
  border-bottom-width: 2px;
  border-bottom-color: var(--ink);
  padding-bottom: 0.3125rem;
}
.hxp .flip .cell:hover:not(:disabled):not([aria-pressed="true"]) {
  color: var(--ink-muted);
  border-bottom-color: color-mix(in oklab, var(--ink) 40%, transparent);
}
.hxp .flip .cell:focus-visible {
  outline: 2px solid var(--red);
  outline-offset: 3px;
}
.hxp .flip .cell:disabled { cursor: default; }
/* In flight: the reading is the one you asked for, printed lighter until the
   server confirms it. */
.hxp .flip.busy .cell[aria-pressed="true"] {
  color: var(--ink-muted);
  border-bottom-color: var(--ink-muted);
}
`;

export function FeatureToggle({
  label,
  value,
  onSet,
  busy = false,
}: {
  /** Names what is being switched, for assistive tech: a feature, a person. */
  label: string;
  /** `null` when no flag row exists yet — neither state is live. */
  value: boolean | null;
  /** Omit for a read-only reading of the flag. */
  onSet?: (enabled: boolean) => void;
  /** True while a save is in flight, so `value` is what was asked for. */
  busy?: boolean;
}) {
  const states: boolean[] = [false, true];
  return (
    <span className={busy ? "flip busy" : "flip"}>
      {states.map((state) => (
        <button
          key={String(state)}
          type="button"
          className="cell"
          aria-pressed={value === state}
          aria-label={`${label} ${state ? "on" : "off"}`}
          disabled={onSet === undefined || busy}
          onClick={() => {
            if (value !== state) onSet?.(state);
          }}
        >
          {state ? "On" : "Off"}
        </button>
      ))}
    </span>
  );
}

/**
 * What the control should read while a save is in flight.
 *
 * The page is drawn from the server's copy of the flags, so a press would
 * otherwise keep showing the old value for the length of the round trip and
 * the refresh behind it — which reads as "nothing happened". This holds the
 * asked-for value in front of the server's until the two agree, and puts it
 * back if the save is refused.
 */
export function useFlagSave(actual: boolean | null) {
  const [wanted, setWanted] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  if (wanted !== null && wanted === actual) setWanted(null);

  /** Runs `save`, holding the control at `next` until the server agrees. */
  const set = async (next: boolean, save: () => Promise<boolean>) => {
    setWanted(next);
    setSaving(true);
    const saved = await save();
    setSaving(false);
    if (!saved) setWanted(null);
  };

  return { value: wanted ?? actual, busy: saving, set };
}
