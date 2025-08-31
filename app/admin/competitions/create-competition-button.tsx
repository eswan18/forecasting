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
import { CreateEditCompetitionForm } from "@/components/forms/create-edit-competition-form";

export default function CreateCompetitionButton({
  className,
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  className = cn("gap-2", className);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <span>New Competition</span>
          <PlusCircle />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new competition</DialogTitle>
        </DialogHeader>
        <CreateEditCompetitionForm onSubmit={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
