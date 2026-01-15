"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { startImpersonation } from "@/lib/auth/impersonation";
import { VUser } from "@/types/db_types";

interface UserNameCellProps {
  user: VUser;
}

export function UserNameCell({ user }: UserNameCellProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const name = user.name;

  const handleImpersonate = async () => {
    setIsLoading(true);
    try {
      const result = await startImpersonation(user.id);
      if (result.success) {
        toast({
          title: "Impersonating",
          description: `Now viewing as ${name}`,
        });
        setIsDialogOpen(false);
        router.push("/");
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to impersonate user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to impersonate user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-2">
      <div className="flex flex-row gap-x-1 sm:gap-x-2 items-center text-sm sm:text-lg">
        <div className="flex items-center gap-x-1 min-w-0 flex-1">
          <Link
            href={`/admin/users/${user.id}`}
            className="flex items-center gap-x-1 hover:text-primary transition-colors min-w-0"
          >
            <span className="truncate">{name}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </Link>
          {/* Impersonate button - only show for non-admin, active users */}
          {!user.is_admin && !user.deactivated_at && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-5 w-5 p-0 flex-shrink-0"
                  title="Impersonate user"
                >
                  <User className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Impersonate User?</DialogTitle>
                  <DialogDescription>
                    You will view the app as {name}. Your admin session remains
                    active - click &quot;Stop Impersonating&quot; in the banner
                    to return to your own view.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImpersonate}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? "Starting..." : "Impersonate"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground truncate">
        {user.email}
      </div>
    </div>
  );
}
