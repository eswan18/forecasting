"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useServerAction } from "@/hooks/use-server-action";
import {
  addCompetitionMemberById,
  getEligibleMembers,
  type CompetitionRole,
} from "@/lib/db_actions/competition-members";

interface EligibleUser {
  id: number;
  name: string;
  username: string | null;
}

function formatUserLabel(user: EligibleUser): string {
  return user.username ? `${user.name} (${user.username})` : user.name;
}

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
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [role, setRole] = useState<CompetitionRole>("forecaster");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[] | null>(
    null,
  );
  const [isLoadingUsers, startLoadingUsers] = useTransition();
  const router = useRouter();

  // Load eligible users when the dialog opens
  useEffect(() => {
    if (!isOpen) return;
    startLoadingUsers(async () => {
      const result = await getEligibleMembers(competitionId);
      if (result.success) {
        setEligibleUsers(result.data);
      }
    });
  }, [isOpen, competitionId]);

  const handleSuccess = () => {
    router.refresh();
    setSelectedUserId(null);
    setRole("forecaster");
    setEligibleUsers(null);
    onClose();
  };

  const addMemberAction = useServerAction(addCompetitionMemberById, {
    successMessage: "Member added successfully",
    onSuccess: handleSuccess,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId === null) return;

    await addMemberAction.execute({
      competitionId,
      userId: selectedUserId,
      role,
    });
  };

  const handleClose = () => {
    if (!addMemberAction.isLoading) {
      setSelectedUserId(null);
      setRole("forecaster");
      setPopoverOpen(false);
      onClose();
    }
  };

  const selectedUser = eligibleUsers?.find((u) => u.id === selectedUserId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Search for a user to add to this competition.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">User</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between font-normal"
                    disabled={addMemberAction.isLoading}
                  >
                    {selectedUser
                      ? formatUserLabel(selectedUser)
                      : "Select a user..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search by name or username..." />
                    <CommandList>
                      {isLoadingUsers ? (
                        <div className="flex items-center justify-center py-6">
                          <Spinner className="h-4 w-4" />
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>No users found.</CommandEmpty>
                          <CommandGroup>
                            {(eligibleUsers ?? []).map((user) => (
                              <CommandItem
                                key={user.id}
                                value={formatUserLabel(user)}
                                onSelect={() => {
                                  setSelectedUserId(
                                    user.id === selectedUserId
                                      ? null
                                      : user.id,
                                  );
                                  setPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedUserId === user.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {formatUserLabel(user)}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
            <Button
              type="submit"
              disabled={addMemberAction.isLoading || selectedUserId === null}
            >
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
