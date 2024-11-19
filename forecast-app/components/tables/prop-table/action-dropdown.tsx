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

export interface ActionDropdownProps {
  propId: number;
  resolution: boolean | null;
}

export function ActionDropdown({ propId, resolution }: ActionDropdownProps) {
  const actions = resolution !== null
    ? [{
      "label": "Unresolve",
      "onClick": async () => {
        unresolveProp({ propId });
      },
    }]
    : [
      {
        label: "Resolve to Yes",
        onClick: async () => {
          resolveProp({ propId, resolution: true });
        },
      },
      {
        label: "Resolve to No",
        onClick: async () => {
          resolveProp({ propId, resolution: false });
        },
      },
    ];
  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <span className="sr-only">Open menu</span>
            <Edit size={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {actions.map(({ label, onClick }, i) => (
            <DropdownMenuItem key={i} onClick={onClick}>
              {label}
            </DropdownMenuItem>
          ))}
          <DialogTrigger asChild>
            <DropdownMenuItem>Edit</DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Prop</DialogTitle>
        </DialogHeader>
        hi!
      </DialogContent>
    </Dialog>
  );
}
