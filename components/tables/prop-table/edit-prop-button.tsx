"use client";

import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveProp, unresolveProp } from "@/lib/db_actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VProp } from "@/types/db_types";
import { CreateEditPropForm } from "@/components/forms/create-edit-prop-form";

export function EditPropButton({ prop }: { prop: VProp }) {
  const actions = prop.resolution !== null
    ? [{
      "label": "Unresolve",
      "onClick": async () => {
        unresolveProp({ propId: prop.prop_id });
      },
    }]
    : [
      {
        label: "Resolve to Yes",
        onClick: async () => {
          resolveProp({ propId: prop.prop_id, resolution: true });
        },
      },
      {
        label: "Resolve to No",
        onClick: async () => {
          resolveProp({ propId: prop.prop_id, resolution: false });
        },
      },
    ];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <span className="sr-only">Open menu</span>
          <Edit size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Prop</DialogTitle>
        </DialogHeader>
        <CreateEditPropForm initialProp={prop} />
      </DialogContent>
    </Dialog>
  );
}
