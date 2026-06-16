import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Admin vs. regular-user role pill. Admins get an indigo-tinted badge with a
 * shield (matching the competition members table); regular users get a neutral
 * outline. Replaces the old hardcoded `bg-red-100 text-red-800` treatment.
 */
export function UserRoleBadge({ isAdmin }: { isAdmin: boolean }) {
  if (isAdmin) {
    return (
      <Badge
        variant="secondary"
        className="border-transparent bg-primary/10 text-primary"
      >
        <Shield className="mr-1 h-3 w-3" />
        Admin
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      User
    </Badge>
  );
}

/**
 * Active vs. deactivated account-status pill. Uses the semantic `success`
 * token for active accounts and a neutral outline for inactive ones, replacing
 * the old hardcoded green/gray colors.
 */
export function UserStatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <Badge
        variant="secondary"
        className="border-transparent bg-success-muted text-success-muted-foreground"
      >
        Active
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Inactive
    </Badge>
  );
}
