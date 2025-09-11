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
import { Loader2 } from "lucide-react";

interface PropEditDialogProps {
  prop: VProp;
  isOpen: boolean;
  onClose: () => void;
}

export function PropEditDialog({ prop, isOpen, onClose }: PropEditDialogProps) {
  const [text, setText] = useState(prop.prop_text);
  const [notes, setNotes] = useState(prop.prop_notes || "");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (text.trim().length < 8) {
      // TODO: Add proper validation error handling
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateProp({
        id: prop.prop_id,
        prop: {
          text: text.trim(),
          notes: notes.trim() || null,
        },
      });

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        console.error("Failed to update prop:", result.error);
        // TODO: Add proper error handling/toast
      }
    } catch (error) {
      console.error("Failed to update prop:", error);
      // TODO: Add proper error handling/toast
    } finally {
      setIsLoading(false);
    }
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
              Proposition Text *
            </Label>
            <Textarea
              id="text"
              placeholder="Enter the proposition text..."
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
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
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
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
