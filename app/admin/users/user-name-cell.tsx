import Link from "next/link";

import { VUser } from "@/types/db_types";

import { UserAccessMark, UserRoleMark } from "./user-badges";

/**
 * The account column: the name, the address under it, and — on a narrow page,
 * where the two mark columns have folded away — whatever marks the account
 * carries.
 *
 * The marks are printed twice in the markup and shown once by the media query.
 * Only one copy is ever displayed, so nothing is read out twice; the
 * alternative was one copy moved by grid placement, which cannot put a mark on
 * the same line as the address it belongs beside.
 */
export function UserNameCell({ user }: { user: VUser }) {
  return (
    <span className="who">
      <span className="nm">
        <Link href={`/admin/users/${user.id}`}>{user.name}</Link>
      </span>
      {user.email && <span className="em">{user.email}</span>}
      <span className="marks">
        <UserRoleMark isAdmin={user.is_admin} />
        <UserAccessMark active={user.deactivated_at === null} />
      </span>
    </span>
  );
}
