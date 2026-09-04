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
import { updateProp } from "@/lib/db_actions/props";
import { updatePropOptions } from "@/lib/db_actions";
import { isChoiceKind, MAX_OPTION_LENGTH } from "@/lib/prop-kind";
import { useRouter } from "next/navigation";
import { useServerAction } from "@/hooks/use-server-action";

// The same measures the new-prop form holds its claim and notes to.
const CLAIM_MAX = 300;
const NOTES_MAX = 1000;

interface PropEditDialogProps {
  prop: VProp & { options?: PropOptionSummary[] };
  isOpen: boolean;
  onClose: () => void;
}

export function PropEditDialog({ prop, isOpen, onClose }: PropEditDialogProps) {
  const [text, setText] = useState(prop.prop_text);
  const [notes, setNotes] = useState(prop.prop_notes || "");
  // Labels only: the option set is frozen once forecasts hang off option ids,
  // so this edits `text` per option and never adds or removes rows.
  const [labels, setLabels] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      (prop.options ?? []).map((option) => [option.option_id, option.text]),
    ),
  );
  const router = useRouter();
  const textId = useId();
  const notesId = useId();
  const optionsLabelId = useId();

  const options = isChoiceKind(prop.prop_kind) ? (prop.options ?? []) : [];

  const updatePropAction = useServerAction(updateProp, {
    successMessage: "Prop updated!",
  });
  const updateOptionsAction = useServerAction(updatePropOptions, {
    successMessage: "Option labels updated!",
  });

  const isLoading = updatePropAction.isLoading || updateOptionsAction.isLoading;
  const refusal = updatePropAction.error || updateOptionsAction.error;

  const isTextValid = text.trim().length >= 8;
  const areLabelsValid = options.every(
    (option) => (labels[option.option_id] ?? "").trim().length > 0,
  );
  const labelsChanged = options.some(
    (option) => (labels[option.option_id] ?? "").trim() !== option.text,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTextValid || !areLabelsValid) return;

    const propResult = await updatePropAction.execute({
      id: prop.prop_id,
      prop: {
        text: text.trim(),
        notes: notes.trim() || null,
      },
    });
    if (!propResult.success) return;

    if (labelsChanged) {
      const optionsResult = await updateOptionsAction.execute({
        propId: prop.prop_id,
        options: options.map((option) => ({
          id: option.option_id,
          text: (labels[option.option_id] ?? "").trim(),
        })),
      });
      if (!optionsResult.success) return;
    }

    router.refresh();
    onClose();
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit proposition</DialogTitle>
            <DialogDescription>
              {options.length > 0
                ? "The claim, the notes, and what each option is called."
                : "The claim and the notes."}
            </DialogDescription>
          </DialogHeader>

          <div className="hxf">
            <Field
              label="The claim"
              htmlFor={textId}
              hint="Markdown works."
              count={[text.length, CLAIM_MAX]}
              error={
                !isTextValid && text.trim().length > 0
                  ? "Say a little more — at least 8 characters"
                  : undefined
              }
            >
              <textarea
                id={textId}
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isLoading}
              />
            </Field>

            <Field
              label="Notes"
              htmlFor={notesId}
              optional
              hint="How it should be settled. Markdown works."
              count={[notes.length, NOTES_MAX]}
            >
              <textarea
                id={notesId}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isLoading}
              />
            </Field>

            {options.length > 0 && (
              <Field
                label="Options"
                labelId={optionsLabelId}
                hint="Labels only — options can't be added or removed after creation."
              >
                <div
                  className="opts"
                  role="group"
                  aria-labelledby={optionsLabelId}
                >
                  {options.map((option, index) => (
                    <div className="row" key={option.option_id}>
                      <span className="n" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <input
                        type="text"
                        value={labels[option.option_id] ?? ""}
                        onChange={(e) =>
                          setLabels((prev) => ({
                            ...prev,
                            [option.option_id]: e.target.value,
                          }))
                        }
                        maxLength={MAX_OPTION_LENGTH}
                        aria-label={`Option ${index + 1}`}
                        disabled={isLoading}
                      />
                    </div>
                  ))}
                </div>
              </Field>
            )}

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
              disabled={isLoading || !isTextValid || !areLabelsValid}
            >
              {isLoading ? "Saving…" : "Update"}
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
