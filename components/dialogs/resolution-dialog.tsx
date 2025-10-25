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
import { resolveProp, unresolveProp } from "@/lib/db_actions/props";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

interface ResolutionDialogProps {
  prop: VProp;
  isOpen: boolean;
  onClose: () => void;
}

type ResolutionOption = "true" | "false" | "unresolved";

export function ResolutionDialog({
  prop,
  isOpen,
  onClose,
}: ResolutionDialogProps) {
  const [resolution, setResolution] = useState<ResolutionOption>(
    prop.resolution === null
      ? "unresolved"
      : prop.resolution
        ? "true"
        : "false",
  );
  const [notes, setNotes] = useState(prop.resolution_notes || "");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (resolution === "unresolved") {
        await unresolveProp({ propId: prop.prop_id });
      } else {
        await resolveProp({
          propId: prop.prop_id,
          resolution: resolution === "true",
          notes: notes.trim() || undefined,
          userId: null, // Will be set by the server action
          overwrite: true,
        });
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Failed to update resolution:", error);
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
                <Label htmlFor="unresolved" className="text-sm cursor-pointer">
                  Unresolved
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes {resolution !== "unresolved" && "(optional)"}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                resolution === "unresolved"
                  ? "Notes will be removed when unresolved"
                  : "Add notes about this resolution..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={resolution === "unresolved"}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
