"use client";

import { useState } from "react";

// Raw number entry for the forecast percentage (0–100). Commits on Enter/blur,
// Escape reverts; while unfocused it mirrors the current value.
export function PercentInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const formatted = value == null ? "" : String(Math.round(value * 100));
  const display = editing ? draft : formatted;

  const commit = () => {
    setEditing(false);
    const n = Number(draft);
    if (draft.trim() === "" || Number.isNaN(n)) return;
    onChange(Math.max(0, Math.min(100, Math.round(n))) / 100);
  };

  return (
    <label className="inline-flex items-center rounded-md border border-input bg-background px-2 py-1 focus-within:ring-2 focus-within:ring-ring/40">
      <input
        value={display}
        inputMode="numeric"
        placeholder="––"
        aria-label="Forecast percentage"
        onFocus={() => {
          setDraft(formatted);
          setEditing(true);
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            setEditing(false);
            e.currentTarget.blur();
          }
        }}
        className="w-10 bg-transparent text-right text-lg font-bold leading-none text-foreground outline-none"
      />
      <span className="text-lg font-bold leading-none text-foreground">%</span>
    </label>
  );
}
