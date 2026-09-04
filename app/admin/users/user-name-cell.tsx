import Image from "next/image";
import Link from "next/link";

import { VUser } from "@/types/db_types";

/**
 * One account's own half of an entry: the photo, the name, and the address
 * under it.
 *
 * It carries no Admin or Deactivated mark of the kind the old table printed.
 * The directory files each account under a heading that says which it is, so a
 * mark here would print the same word a second time, once per entry, under a
 * heading that already said it once for the whole group. The exception is an
 * admin somebody has closed: it files under Deactivated, and without the mark
 * the page would be the only place that forgot it can be handed its powers back.
 *
 * An account the IdP has no picture for prints nothing at all in the gutter,
 * which the entry holds open regardless so that the names stay flush with each
 * other down the column. The alternative — a disc with an initial set in it —
 * is exactly what got the portrait cut from the members roster and the account
 * panel: it was the only filled surface on the page, and it told the reader
 * nothing the name beside it did not.
 *
 * The photo carries no alt text because it is not information: the name it
 * belongs to is the very next thing in the reading order, and captioning the
 * picture would only make a screen reader say it twice.
 */
export function UserNameCell({
  user,
  isViewer = false,
  showAdminMark = false,
}: {
  user: VUser;
  /** Whether this is the reader's own account, which prints in red. */
  isViewer?: boolean;
  /** Whether to print the Admin mark the group heading is not carrying. */
  showAdminMark?: boolean;
}) {
  return (
    <span className="who">
      {user.picture_url && (
        <span className="face">
          <Image src={user.picture_url} alt="" width={40} height={40} />
        </span>
      )}
      <span className="nm">
        <Link href={`/admin/users/${user.id}`}>{user.name}</Link>
        {isViewer && <span className="vh"> (you)</span>}
        {showAdminMark && user.is_admin && <span className="mark">Admin</span>}
      </span>
      {user.email && <span className="em">{user.email}</span>}
    </span>
  );
}
