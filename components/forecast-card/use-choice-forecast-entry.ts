"use client";

import { useCallback, useMemo, useState } from "react";

import { useServerAction } from "@/hooks/use-server-action";
import { saveChoiceForecast } from "@/lib/db_actions";
import { type ChoiceKind, isChoiceKind } from "@/lib/prop-kind";
import type { PropWithUserForecast } from "@/types/db_types";

import {
  type ChoiceEntryValues,
  entriesEqual,
  isEntryComplete,
  toProbabilities,
  valuesFromOptions,
} from "./choice-entry";

interface UseChoiceForecastEntryOptions {
  /** Called after a successful save, e.g. `router.refresh()`. */
  onSaved?: () => void;
}

interface ChoiceForecastEntry {
  kind: ChoiceKind;
  optionIds: number[];
  values: ChoiceEntryValues;
  setValue: (optionId: number, value: number) => void;
  hasChanges: boolean;
  canSave: boolean;
  isSaving: boolean;
  save: () => Promise<void>;
  cancel: () => void;
}

/**
 * The entry state for one choice prop, shared by every surface that lets a
 * user forecast one: the card in a competition's prop list and the single-prop
 * page. The values live here, the save button's enabled-ness comes from
 * `canSave && hasChanges`, and `save` posts the whole set of probabilities in
 * one server action.
 *
 * Only call this for a choice prop (`isChoiceKind(prop.prop_kind)`). A binary
 * prop carries no options, so the entry would be empty; it fails closed
 * (`canSave` is false) rather than saving nothing.
 *
 * Local edits are re-seeded whenever `prop.options` changes identity — a
 * `router.refresh()` after a save hands down freshly fetched options, and the
 * editor should show what the server now holds, the same way the binary card's
 * `localForecast` restarts from `prop.user_forecast` on remount.
 */
export function useChoiceForecastEntry(
  prop: PropWithUserForecast,
  { onSaved }: UseChoiceForecastEntryOptions = {},
): ChoiceForecastEntry {
  // `one_of` is the safe fallback for a non-choice prop: an empty entry never
  // totals 100%, so `canSave` stays false.
  const kind: ChoiceKind = isChoiceKind(prop.prop_kind)
    ? prop.prop_kind
    : "one_of";

  const optionIds = useMemo(
    () => prop.options.map((option) => option.option_id),
    [prop.options],
  );
  const saved = useMemo(() => valuesFromOptions(prop.options), [prop.options]);

  const [values, setValues] = useState<ChoiceEntryValues>(saved);
  const [seededFrom, setSeededFrom] = useState(saved);
  if (seededFrom !== saved) {
    // New options from the server: drop local edits and show what it holds.
    setSeededFrom(saved);
    setValues(saved);
  }

  const saveAction = useServerAction(saveChoiceForecast, {
    successMessage: "Forecast saved!",
    onSuccess: onSaved,
  });

  const setValue = useCallback((optionId: number, value: number) => {
    setValues((previous) => ({ ...previous, [optionId]: value }));
  }, []);

  const hasChanges = !entriesEqual(values, saved, optionIds);
  const canSave = isEntryComplete(kind, optionIds, values);

  const { execute } = saveAction;
  const save = useCallback(async () => {
    // Guard as well as disabling the button: `toProbabilities` throws on an
    // incomplete entry.
    if (!canSave) return;
    await execute({
      propId: prop.prop_id,
      probabilities: toProbabilities(values, optionIds),
    });
  }, [canSave, execute, optionIds, prop.prop_id, values]);

  const cancel = useCallback(() => setValues(saved), [saved]);

  return {
    kind,
    optionIds,
    values,
    setValue,
    hasChanges,
    canSave,
    isSaving: saveAction.isLoading,
    save,
    cancel,
  };
}
