"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { sheetCss } from "@/components/prop-list/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getBrowserTimezone } from "@/hooks/getBrowserTimezone";
import { toast } from "@/hooks/use-toast";
import { startImpersonation } from "@/lib/auth/impersonation";
import { setUserActive } from "@/lib/db_actions/users";
import { handleServerActionResult } from "@/lib/server-action-helpers";
import { formatDate, formatDateTime } from "@/lib/time-utils";
import { VUser } from "@/types/db_types";

import { UserAccessMark, UserRoleMark, userMarksCss } from "../user-badges";

/**
 * One account, set as a record rather than a card.
 *
 * The avatar the old panel led with is gone, for the reason the members roster
 * dropped its own: it was the only filled surface on the page, it degraded to
 * a grey disc with an initial for anyone the IdP has no picture for, and it
 * told an admin nothing the name above it did not. The photo is still here —
 * as the field it actually is, a URL you can open.
 *
 * Module-level constant, no interpolation: this is a stylesheet, not content.
 */
const ownCss = `
.hxp .masthead .meta { align-items: baseline; }
.hxp .masthead .meta .mark + .mark { margin-left: 0; }
.hxp .masthead .meta .back {
  margin-left: auto;
  text-decoration: none;
  white-space: nowrap;
}
.hxp .masthead .meta .back:hover { color: var(--red-text); }

/* One grid for the whole record, so every value starts at the same x whichever
   section it is read in. */
.hxp .record {
  display: grid;
  grid-template-columns: 10rem minmax(0, 1fr);
  gap: 0;
  align-items: stretch;
}
.hxp .record > * { display: contents; }
.hxp .line > * {
  padding: 0.75rem 0;
  line-height: 1.5rem;
  border-bottom: 1px solid var(--rule);
}
.hxp .line .k {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.hxp .line .v {
  min-width: 0;
  padding-left: 1.5rem;
  overflow-wrap: anywhere;
}
.hxp .line .v.code {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}
.hxp .line .v a { color: inherit; text-decoration: none; border-bottom: 1px solid var(--rule); }
.hxp .line .v a:hover { color: var(--red-text); border-bottom-color: var(--red-text); }

/* A word, not a glyph: the sheets have no icons, and "copy" is shorter to
   understand than a pair of overlapping rectangles. */
.hxp .copy {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-faint);
  background: none;
  border: 0;
  padding: 0 0 0 0.875rem;
  cursor: pointer;
  white-space: nowrap;
}
.hxp .copy:hover { color: var(--red-text); }

.hxp .acts {
  display: flex;
  flex-wrap: wrap;
  gap: 1.75rem;
  padding-top: 2rem;
}
.hxp .act {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ink);
  background: none;
  border: 0;
  border-bottom: 2px solid var(--ink);
  padding: 0 0 0.25rem;
  cursor: pointer;
  white-space: nowrap;
}
.hxp .act:hover:not(:disabled) {
  color: var(--red-text);
  border-bottom-color: var(--red-text);
}
/* Closing an account is the one destructive thing on the page, so it is the
   one thing set in the second ink from the start. */
.hxp .act.danger { color: var(--red-text); border-bottom-color: var(--red); }
.hxp .act:disabled {
  color: var(--ink-faint);
  border-bottom-color: var(--ink-faint);
  cursor: default;
}

@media (max-width: 46rem) {
  .hxp .record { grid-template-columns: minmax(0, 1fr); }
  /* the label names the line above the value rather than the column beside it */
  .hxp .line .k { border-bottom: 0; padding: 0.75rem 0 0; line-height: 1.25rem; }
  .hxp .line .v { padding-left: 0; padding-top: 0.125rem; }
}
`;

/** One line of the record: a mono label, then what it holds. */
function Line({
  label,
  code = false,
  children,
}: {
  label: string;
  /** True for a machine value — an id, a date — which is set in mono. */
  code?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="line">
      <span className="k">{label}</span>
      <span className={code ? "v code" : "v"}>{children}</span>
    </div>
  );
}

function Copy({ value, label }: { value: string; label: string }) {
  return (
    <button
      type="button"
      className="copy"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast({ title: "Copied", description: `${label} copied to clipboard` });
      }}
    >
      Copy
    </button>
  );
}

const NONE = <span className="none">—</span>;

export default function UserDetailCard({ user }: { user: VUser }) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isImpersonateDialogOpen, setIsImpersonateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const timezone = getBrowserTimezone();
  const isActive = user.deactivated_at === null;
  const canImpersonate = !user.is_admin && isActive;

  const handleStatusChange = async () => {
    setIsLoading(true);
    try {
      const result = await setUserActive({
        userId: user.id,
        active: !isActive,
      });
      const updatedUser = handleServerActionResult(result);

      toast({
        title: "Success",
        description: `User ${updatedUser.name} has been ${!isActive ? "activated" : "deactivated"}`,
      });

      setIsStatusDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImpersonate = async () => {
    setIsLoading(true);
    try {
      const result = await startImpersonation(user.id);
      if (result.success) {
        toast({
          title: "Impersonating",
          description: `Now viewing as ${user.name}`,
        });
        setIsImpersonateDialogOpen(false);
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
    <div className="hxp">
      <style
        dangerouslySetInnerHTML={{ __html: sheetCss + userMarksCss + ownCss }}
      />
      <div className="col">
        <header className="masthead">
          <h1>{user.name}</h1>
          <div className="meta">
            <span className="mono ink2">Account</span>
            <UserRoleMark isAdmin={user.is_admin} />
            <UserAccessMark active={isActive} />
            <Link className="mono muted back" href="/admin/users">
              ← Users
            </Link>
          </div>
        </header>

        <h2 className="kicker">
          <span>Identity</span>
        </h2>
        <div className="record">
          <Line label="Email">{user.email || NONE}</Line>
          <Line label="Username">
            {user.username ? (
              <>
                {user.username}
                <Copy value={user.username} label="Username" />
              </>
            ) : (
              NONE
            )}
          </Line>
          <Line label="Photo">
            {user.picture_url ? (
              <a
                href={user.picture_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {user.picture_url}
              </a>
            ) : (
              NONE
            )}
          </Line>
        </div>

        <h2 className="kicker">
          <span>Record</span>
        </h2>
        <div className="record">
          <Line label="Created" code>
            {formatDate(new Date(user.created_at), timezone)}
          </Line>
          <Line label="Updated" code>
            {formatDate(new Date(user.updated_at), timezone)}
          </Line>
          {!isActive && user.deactivated_at && (
            <Line label="Deactivated" code>
              {formatDateTime(new Date(user.deactivated_at), timezone)}
            </Line>
          )}
          <Line label="User ID" code>
            {user.id}
            <Copy value={user.id.toString()} label="User ID" />
          </Line>
          <Line label="IDP user ID" code>
            {user.idp_user_id ? (
              <>
                {user.idp_user_id}
                <Copy value={user.idp_user_id} label="IDP User ID" />
              </>
            ) : (
              NONE
            )}
          </Line>
        </div>

        <h2 className="kicker">
          <span>Actions</span>
        </h2>
        <div className="acts">
          {canImpersonate && (
            <button
              type="button"
              className="act"
              disabled={isLoading}
              onClick={() => setIsImpersonateDialogOpen(true)}
            >
              Impersonate
            </button>
          )}
          <button
            type="button"
            className={isActive ? "act danger" : "act"}
            disabled={isLoading}
            onClick={() => setIsStatusDialogOpen(true)}
          >
            {isActive ? "Deactivate account" : "Activate account"}
          </button>
        </div>
      </div>

      <Dialog
        open={isImpersonateDialogOpen}
        onOpenChange={setIsImpersonateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impersonate User?</DialogTitle>
            <DialogDescription>
              You will view the app as {user.name}. Your admin session remains
              active - click &quot;Stop Impersonating&quot; in the banner to
              return to your own view.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="hxf">
            <button
              type="button"
              className="quit"
              onClick={() => setIsImpersonateDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="submit"
              onClick={handleImpersonate}
              disabled={isLoading}
            >
              {isLoading ? "Starting…" : "Impersonate"}
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isActive ? "Deactivate User?" : "Activate User?"}
            </DialogTitle>
            <DialogDescription>
              {isActive
                ? `Are you sure you want to deactivate ${user.name}? They will no longer be able to access the system.`
                : `Are you sure you want to activate ${user.name}? They will regain access to the system.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="hxf">
            <button
              type="button"
              className="quit"
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className={isActive ? "submit danger" : "submit"}
              onClick={handleStatusChange}
              disabled={isLoading}
            >
              {isLoading ? "Updating…" : isActive ? "Deactivate" : "Activate"}
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
