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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { resolveProp, unresolveProp } from "@/lib/db_actions/props";
import { isChoiceKind } from "@/lib/prop-kind";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
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
        <DialogHeader>
          <DialogTitle>Resolve Proposition</DialogTitle>
          <DialogDescription>
            Set the resolution for: &ldquo;{prop.prop_text}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Resolution</Label>
            {isChoice ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="choice-resolved"
                      name="choice-resolution"
                      value="resolved"
                      checked={choiceMode === "resolved"}
                      onChange={() => setChoiceMode("resolved")}
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="choice-resolved"
                      className="text-sm cursor-pointer"
                    >
                      Resolved
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="choice-unresolved"
                      name="choice-resolution"
                      value="unresolved"
                      checked={choiceMode === "unresolved"}
                      onChange={() => setChoiceMode("unresolved")}
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor="choice-unresolved"
                      className="text-sm cursor-pointer"
                    >
                      Unresolved
                    </Label>
                  </div>
                </div>

                {choiceMode === "resolved" && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      {singleWinner
                        ? "Winning option"
                        : "Options that happened"}
                    </p>
                    <div className="space-y-2">
                      {options.map((option) => (
                        <div
                          key={option.option_id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type={singleWinner ? "radio" : "checkbox"}
                            id={`option-${option.option_id}`}
                            name={
                              singleWinner
                                ? "prop-outcome"
                                : `prop-outcome-${option.option_id}`
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
                            className="h-4 w-4"
                          />
                          <Label
                            htmlFor={`option-${option.option_id}`}
                            className="text-sm cursor-pointer"
                          >
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {singleWinner
                      ? winnerId === null && (
                          <p className="text-xs text-muted-foreground">
                            Pick the option that happened.
                          </p>
                        )
                      : checked.size === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Nothing selected &mdash; resolves as none of these
                            happened.
                          </p>
                        )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="true"
                    name="resolution"
                    value="true"
                    checked={resolution === "true"}
                    onChange={(e) =>
                      setResolution(e.target.value as ResolutionOption)
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="true" className="text-sm cursor-pointer">
                    True
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="false"
                    name="resolution"
                    value="false"
                    checked={resolution === "false"}
                    onChange={(e) =>
                      setResolution(e.target.value as ResolutionOption)
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="false" className="text-sm cursor-pointer">
                    False
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="unresolved"
                    name="resolution"
                    value="unresolved"
                    checked={resolution === "unresolved"}
                    onChange={(e) =>
                      setResolution(e.target.value as ResolutionOption)
                    }
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor="unresolved"
                    className="text-sm cursor-pointer"
                  >
                    Unresolved
                  </Label>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes {!unresolving && "(optional)"}{" "}
              {!unresolving && (
                <span className="text-xs text-muted-foreground font-normal">
                  (Markdown supported)
                </span>
              )}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                unresolving
                  ? "Notes will be removed when unresolved"
                  : "Add notes about this resolution... Markdown formatting (links, bold, italic) is supported."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={unresolving}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || missingWinner}>
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
