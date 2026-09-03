"use client";

import { useState } from "react";

import { CreateEditCompetitionForm } from "@/components/forms/create-edit-competition-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The one thing this page does besides list: a mono-caps line in the section
 * head, in ink because it is the page's only action. The dialog behind it stays
 * as it is — every editor in the app still opens in a shadcn dialog.
 */
export default function CreateCompetitionButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="make" onClick={() => setOpen(true)}>
        + New competition
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new competition</DialogTitle>
          </DialogHeader>
          <CreateEditCompetitionForm onSubmit={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
