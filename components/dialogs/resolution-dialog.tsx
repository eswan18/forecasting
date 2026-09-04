"use client";

import { useId, useState } from "react";
import type { PropOptionSummary, VProp } from "@/types/db_types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Refusal } from "@/components/form-sheet/form-sheet";
import { resolveProp, unresolveProp } from "@/lib/db_actions/props";
import { isChoiceKind } from "@/lib/prop-kind";
import { useRouter } from "next/navigation";
import { useServerAction } from "@/hooks/use-server-action";

interface ResolutionDialogProps {
  prop: VProp & { options?: PropOptionSummary[] };
  isOpen: boolean;
  onClose: () => void;
}

type ResolutionOption = "true" | "false" | "unresolved";
type ChoiceMode = "resolved" | "unresolved";

export function ResolutionDialog({
  prop,
  isOpen,
  onClose,
}: ResolutionDialogProps) {
  // Choice props resolve per option; a choice prop whose options never reached
  // this dialog falls back to the yes/no controls rather than an empty list.
  const options = isChoiceKind(prop.prop_kind) ? (prop.options ?? []) : [];
  const isChoice = options.length > 0;
  // `one_of` has exactly one winner (radios); `any_of` any number (checkboxes).
  const singleWinner = prop.prop_kind === "one_of";

  const [resolution, setResolution] = useState<ResolutionOption>(
    prop.resolution === null
      ? "unresolved"
      : prop.resolution
        ? "true"
        : "false",
  );
  // A resolved choice prop carries a null `resolution` on its header row, so
  // the resolved/unresolved seed comes from `resolution_id`.
  const [choiceMode, setChoiceMode] = useState<ChoiceMode>(
    prop.resolution_id === null ? "unresolved" : "resolved",
  );
  const [winnerId, setWinnerId] = useState<number | null>(
    () => options.find((option) => option.outcome === true)?.option_id ?? null,
  );
  const [checked, setChecked] = useState<Set<number>>(
    () =>
      new Set(
        options
          .filter((option) => option.outcome === true)
          .map((option) => option.option_id),
      ),
  );
  const [notes, setNotes] = useState(prop.resolution_notes || "");
  const router = useRouter();
  const resolutionId = useId();
  const outcomesId = useId();
  const notesId = useId();

  const unresolving = isChoice
    ? choiceMode === "unresolved"
    : resolution === "unresolved";
  // `one_of` needs a winner before it can be submitted; `any_of` may resolve
  // with nothing selected (none of the options happened).
  const missingWinner =
    isChoice && !unresolving && singleWinner && winnerId === null;

  const handleSuccess = () => {
    router.refresh();
    onClose();
  };

  const resolvePropAction = useServerAction(resolveProp, {
    successMessage: "Resolution updated!",
    onSuccess: handleSuccess,
  });

  const unresolvePropAction = useServerAction(unresolveProp, {
    successMessage: "Prop unresolved!",
    onSuccess: handleSuccess,
  });

  const isLoading =
    resolvePropAction.isLoading || unresolvePropAction.isLoading;
  const refusal = resolvePropAction.error || unresolvePropAction.error;

  const toggleChecked = (optionId: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (unresolving) {
      await unresolvePropAction.execute({ propId: prop.prop_id });
      return;
    }
    if (isChoice) {
      if (missingWinner) return;
      await resolvePropAction.execute({
        propId: prop.prop_id,
        outcomes: options.map((option) => ({
          optionId: option.option_id,
          outcome: singleWinner
            ? option.option_id === winnerId
            : checked.has(option.option_id),
        })),
        notes: notes.trim() || undefined,
        userId: null, // Will be set by the server action
        overwrite: true,
      });
      return;
    }
    await resolvePropAction.execute({
      propId: prop.prop_id,
      resolution: resolution === "true",
      notes: notes.trim() || undefined,
      userId: null, // Will be set by the server action
      overwrite: true,
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Resolve proposition</DialogTitle>
            <DialogDescription>{prop.prop_text}</DialogDescription>
          </DialogHeader>

          <div className="hxf">
            <Field label="Resolution" labelId={resolutionId}>
              {isChoice ? (
                <div
                  className="choose"
                  role="radiogroup"
                  aria-labelledby={resolutionId}
                >
                  <label htmlFor={`${resolutionId}-r`}>
                    <input
                      type="radio"
                      id={`${resolutionId}-r`}
                      name={`${resolutionId}-mode`}
                      checked={choiceMode === "resolved"}
                      onChange={() => setChoiceMode("resolved")}
                      disabled={isLoading}
                    />
                    <span className="who">Resolved</span>
                  </label>
                  <label htmlFor={`${resolutionId}-u`}>
                    <input
                      type="radio"
                      id={`${resolutionId}-u`}
                      name={`${resolutionId}-mode`}
                      checked={choiceMode === "unresolved"}
                      onChange={() => setChoiceMode("unresolved")}
                      disabled={isLoading}
                    />
                    <span className="who">Unresolved</span>
                  </label>
                </div>
              ) : (
                <div
                  className="choose"
                  role="radiogroup"
                  aria-labelledby={resolutionId}
                >
                  {(
                    [
                      ["true", "True"],
                      ["false", "False"],
                      ["unresolved", "Unresolved"],
                    ] as [ResolutionOption, string][]
                  ).map(([value, label]) => (
                    <label key={value} htmlFor={`${resolutionId}-${value}`}>
                      <input
                        type="radio"
                        id={`${resolutionId}-${value}`}
                        name={`${resolutionId}-resolution`}
                        value={value}
                        checked={resolution === value}
                        onChange={() => setResolution(value)}
                        disabled={isLoading}
                      />
                      <span className="who">{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </Field>

            {isChoice && choiceMode === "resolved" && (
              <Field
                label={
                  singleWinner ? "Winning option" : "Options that happened"
                }
                labelId={outcomesId}
                hint={
                  singleWinner
                    ? winnerId === null
                      ? "Pick the option that happened."
                      : undefined
                    : checked.size === 0
                      ? "Nothing selected — resolves as none of these happened."
                      : undefined
                }
              >
                <div
                  className="choose"
                  // `any_of` takes any number of options, so its group is not a
                  // radiogroup however alike the two look.
                  role={singleWinner ? "radiogroup" : "group"}
                  aria-labelledby={outcomesId}
                >
                  {options.map((option) => (
                    <label
                      key={option.option_id}
                      htmlFor={`${outcomesId}-${option.option_id}`}
                    >
                      <input
                        type={singleWinner ? "radio" : "checkbox"}
                        id={`${outcomesId}-${option.option_id}`}
                        name={
                          singleWinner
                            ? `${outcomesId}-outcome`
                            : `${outcomesId}-outcome-${option.option_id}`
                        }
                        checked={
                          singleWinner
                            ? winnerId === option.option_id
                            : checked.has(option.option_id)
                        }
                        onChange={() =>
                          singleWinner
                            ? setWinnerId(option.option_id)
                            : toggleChecked(option.option_id)
                        }
                        disabled={isLoading}
                      />
                      <span className="who">{option.text}</span>
                    </label>
                  ))}
                </div>
              </Field>
            )}

            <Field
              label="Notes"
              htmlFor={notesId}
              optional={!unresolving}
              hint={
                unresolving
                  ? "Removed when the prop is unresolved."
                  : "How it was settled. Markdown works."
              }
            >
              <textarea
                id={notesId}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={unresolving || isLoading}
              />
            </Field>

            {refusal && <Refusal message={refusal} />}
          </div>

          <DialogFooter className="hxf">
            <button
              type="button"
              className="quit"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit"
              disabled={isLoading || missingWinner}
            >
              {isLoading ? "Saving…" : unresolving ? "Unresolve" : "Resolve"}
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
