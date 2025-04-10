"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";
import { useState } from "react";

export default function ResolutionSelectWidget(
  { resolution, setResolution, size = "lg" }: {
    resolution: boolean | undefined;
    setResolution: (value: boolean | undefined, notes?: string) => void;
    size?: "sm" | "lg";
  },
) {
  const [lastClicked, setLastClicked] = useState<boolean | undefined>(
    undefined,
  );
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [dialogIsOpen, setDialogIsOpen] = useState<boolean>(false);
  // If the last clicked button is the same as the current resolution, we want to
  // unresolve it. Otherwise, we want to set it to the last clicked value.
  const resolutionToSet = lastClicked === resolution ? undefined : lastClicked;
  const buttonClasses = (selected: boolean) =>
    `${
      size == "lg" ? "px-4 py-1.5" : "px-2 py-1"
    } rounded-full transition-colors duration-200 hover:bg-accent hover:text-accent-foreground ${
      selected ? "bg-background" : "text-muted-foreground"
    }`;
  return (
    <div className="inline-flex justify-between items-center bg-secondary rounded-full p-1 w-fit">
      <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
        <DialogTrigger asChild>
          <button
            className={buttonClasses(resolution === false)}
            onClick={() => setLastClicked(false)}
          >
            <X
              size={20}
              strokeWidth={3}
              className={resolution === false ? "text-destructive" : ""}
            />
          </button>
        </DialogTrigger>
        <DialogTrigger asChild>
          <button
            className={buttonClasses(resolution === true)}
            onClick={() => setLastClicked(true)}
          >
            <Check
              size={20}
              strokeWidth={3}
              className={resolution === true ? "text-green-500" : ""}
            />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolutionToSet === undefined
                ? "Unresolve Prop"
                : "Resolve Prop"}
            </DialogTitle>
          </DialogHeader>
          {resolutionToSet !== undefined
            ? (
              <div>
                <Label>
                  Add a note (optional)
                </Label>
                <Input
                  type="text"
                  placeholder="Details about why this was resolved."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>
            )
            : <p>Are you sure?</p>}
          <DialogFooter>
            {resolutionToSet === undefined
              ? (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setResolution(undefined);
                    setResolutionNotes("");
                    setDialogIsOpen(false);
                  }}
                >
                  Unresolve
                </Button>
              )
              : (
                <Button
                  onClick={() => {
                    setResolution(resolutionToSet, resolutionNotes);
                    setResolutionNotes("");
                    setDialogIsOpen(false);
                  }}
                >
                  Resolve to {resolutionToSet ? "True" : "False"}
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
