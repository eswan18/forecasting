"use client";

import { useState } from "react";
import { VProp } from "@/types/db_types";
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
import { updateProp } from "@/lib/db_actions/props";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useServerAction } from "@/hooks/use-server-action";

interface PropEditDialogProps {
  prop: VProp;
  isOpen: boolean;
  onClose: () => void;
}

export function PropEditDialog({ prop, isOpen, onClose }: PropEditDialogProps) {
  const [text, setText] = useState(prop.prop_text);
  const [notes, setNotes] = useState(prop.prop_notes || "");
  const router = useRouter();

  const updatePropAction = useServerAction(updateProp, {
    successMessage: "Prop updated!",
    onSuccess: () => {
      router.refresh();
      onClose();
    },
  });

  const isLoading = updatePropAction.isLoading;

  const handleSubmit = async () => {
    if (text.trim().length < 8) {
      // TODO: Add proper validation error handling
      return;
    }

    await updatePropAction.execute({
      id: prop.prop_id,
      prop: {
        text: text.trim(),
        notes: notes.trim() || null,
      },
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const isTextValid = text.trim().length >= 8;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Proposition</DialogTitle>
          <DialogDescription>
            Update the proposition text and notes
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !isTextValid}>
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
