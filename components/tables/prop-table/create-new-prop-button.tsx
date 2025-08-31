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
}: {
  className?: string;
  defaultCompetitionId?: number;
  defaultUserId?: number;
}) {
  const [open, setOpen] = useState(false);
  className = cn("gap-2", className);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <span>New prop</span>
          <PlusCircle />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
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
