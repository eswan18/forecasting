"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useServerAction } from "@/hooks/use-server-action";
import {
  addCompetitionMember,
  type CompetitionRole,
} from "@/lib/db_actions/competition-members";

interface InviteMemberDialogProps {
  competitionId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteMemberDialog({
  competitionId,
  isOpen,
  onClose,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CompetitionRole>("forecaster");
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
    setEmail("");
    setRole("forecaster");
    onClose();
  };

  const addMemberAction = useServerAction(addCompetitionMember, {
    successMessage: "Member added successfully",
    onSuccess: handleSuccess,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    await addMemberAction.execute({
      competitionId,
      userEmail: email.trim(),
      role,
    });
  };

  const handleClose = () => {
    if (!addMemberAction.isLoading) {
      setEmail("");
      setRole("forecaster");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Add a new member to this competition by their email address.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={addMemberAction.isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                The user must already have an account in the system.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Role</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="forecaster"
                    name="role"
                    value="forecaster"
                    checked={role === "forecaster"}
                    onChange={(e) =>
                      setRole(e.target.value as CompetitionRole)
                    }
                    className="h-4 w-4"
                    disabled={addMemberAction.isLoading}
                  />
                  <Label htmlFor="forecaster" className="text-sm cursor-pointer">
                    Forecaster
                    <span className="text-muted-foreground font-normal ml-1">
                      — Can view and make predictions
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="admin"
                    name="role"
                    value="admin"
                    checked={role === "admin"}
                    onChange={(e) =>
                      setRole(e.target.value as CompetitionRole)
                    }
                    className="h-4 w-4"
                    disabled={addMemberAction.isLoading}
                  />
                  <Label htmlFor="admin" className="text-sm cursor-pointer">
                    Admin
                    <span className="text-muted-foreground font-normal ml-1">
                      — Can manage props and members
                    </span>
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addMemberAction.isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addMemberAction.isLoading}>
              {addMemberAction.isLoading && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              Add Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
