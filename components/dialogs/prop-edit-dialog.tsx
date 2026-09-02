"use client";

import { useState } from "react";
import type { PropOptionSummary, VProp } from "@/types/db_types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateProp } from "@/lib/db_actions/props";
import { updatePropOptions } from "@/lib/db_actions";
import { isChoiceKind, MAX_OPTION_LENGTH } from "@/lib/prop-kind";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useServerAction } from "@/hooks/use-server-action";

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

  const options = isChoiceKind(prop.prop_kind) ? (prop.options ?? []) : [];

  const updatePropAction = useServerAction(updateProp, {
    successMessage: "Prop updated!",
  });
  const updateOptionsAction = useServerAction(updatePropOptions, {
    successMessage: "Option labels updated!",
  });

  const isLoading = updatePropAction.isLoading || updateOptionsAction.isLoading;

  const isTextValid = text.trim().length >= 8;
  const areLabelsValid = options.every(
    (option) => (labels[option.option_id] ?? "").trim().length > 0,
  );
  const labelsChanged = options.some(
    (option) => (labels[option.option_id] ?? "").trim() !== option.text,
  );

  const handleSubmit = async () => {
    if (!isTextValid || !areLabelsValid) {
      // TODO: Add proper validation error handling
      return;
    }

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
        <DialogHeader>
          <DialogTitle>Edit Proposition</DialogTitle>
          <DialogDescription>
            {options.length > 0
              ? "Update the proposition text, notes, and option labels"
              : "Update the proposition text and notes"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="text" className="text-sm font-medium">
              Proposition Text *{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (Markdown supported)
              </span>
            </Label>
            <Textarea
              id="text"
              placeholder="Enter the proposition text... Markdown formatting (links, bold, italic) is supported."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[100px]"
            />
            {!isTextValid && text.trim().length > 0 && (
              <p className="text-xs text-destructive">
                Proposition text must be at least 8 characters long
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (optional){" "}
              <span className="text-xs text-muted-foreground font-normal">
                (Markdown supported)
              </span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes... Markdown formatting (links, bold, italic) is supported."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {options.length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Options
              </p>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div
                    key={option.option_id}
                    className="flex items-center gap-2"
                  >
                    <span className="w-5 shrink-0 font-mono text-[10px] font-medium uppercase tracking-[0.12em] tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Input
                      value={labels[option.option_id] ?? ""}
                      onChange={(e) =>
                        setLabels((prev) => ({
                          ...prev,
                          [option.option_id]: e.target.value,
                        }))
                      }
                      maxLength={MAX_OPTION_LENGTH}
                      placeholder={`Option ${index + 1}`}
                      aria-label={`Option ${index + 1}`}
                      className="shadow-none"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Labels only — options can&apos;t be added or removed after
                creation.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !isTextValid || !areLabelsValid}
          >
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
