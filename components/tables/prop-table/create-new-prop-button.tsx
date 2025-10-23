"use client";
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreateEditPropForm } from "@/components/forms/create-edit-prop-form";

export default function CreateNewPropButton({
  className,
  defaultCompetitionId,
  defaultUserId,
  iconOnly = false,
}: {
  className?: string;
  defaultCompetitionId?: number | null;
  defaultUserId?: number;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  className = cn(iconOnly ? "" : "gap-2", className);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <PlusCircle className="h-4 w-4" />
          {!iconOnly && <span>New prop</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="mb-4">
          <DialogTitle>Create new prop</DialogTitle>
        </DialogHeader>
        <CreateEditPropForm
          onSubmit={() => setOpen(false)}
          defaultUserId={defaultUserId}
          defaultCompetitionId={defaultCompetitionId}
        />
      </DialogContent>
    </Dialog>
  );
}
