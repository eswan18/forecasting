"use client";

import { CSSProperties, Fragment, useMemo, useState } from "react";
import Link from "next/link";

import { sheetCss } from "@/components/prop-list/sheet";
import { VUser } from "@/types/db_types";

import { ledgerCss } from "./ledger-css";
import { UserActionsCell } from "./user-actions-cell";
import { UserNameCell } from "./user-name-cell";

/**
 * The three standings an account can be in, in the order they are printed.
 *
 * These were two columns until they were three headings. A column headed
 * "Access" that prints nothing on twenty-five rows out of twenty-six is not a
 * quiet column, it is a promise of information the page never keeps; the fact
 * it was there to carry is better said once, over the accounts it is true of,
 * than left blank beside every account it is not.
 */
const GROUPS = [
  { key: "admin", head: "Admins" },
  { key: "forecaster", head: "Forecasters" },
  { key: "deactivated", head: "Deactivated" },
] as const;

type GroupKey = (typeof GROUPS)[number]["key"];

/**
 * Which group an account is filed under.
 *
 * A closed account files under Deactivated whatever else it is: it cannot use
 * the site at all, which outranks anything it could do if it could.
 */
function groupOf(user: VUser): GroupKey {
  if (user.deactivated_at !== null) return "deactivated";
  return user.is_admin ? "admin" : "forecaster";
}

/**
 * Every account, as a directory.
 *
 * The one search box reads the name and the address together, because an admin
 * looking for somebody types whichever half they know. It filters rather than
 * jumps: a group with nothing left in it stops printing, so the shape of the
 * page answers "how many admins match this" without anybody counting.
 */
export default function UsersTable({
  data,
  currentUserId,
}: {
  data: VUser[];
  /** Whose entry prints in red. Null when the viewer cannot be resolved. */
  currentUserId?: number | null;
}) {
  const [query, setQuery] = useState("");

  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const found = needle
      ? data.filter(
          (user) =>
            user.name.toLowerCase().includes(needle) ||
            (user.email?.toLowerCase().includes(needle) ?? false),
        )
      : data;

    return GROUPS.map(({ key, head }) => ({
      key,
      head,
      // Alphabetical inside the group. Sign-up order was the ledger's default
      // when the page was a table you could re-sort; a directory you read to
      // find one person is ordered the way a directory is.
      users: found
        .filter((user) => groupOf(user) === key)
        .sort((a, b) => a.name.localeCompare(b.name)),
    })).filter((section) => section.users.length > 0);
  }, [data, query]);

  const found = sections.reduce(
    (total, section) => total + section.users.length,
    0,
  );

  return (
    <div className="hxp">
      <style dangerouslySetInnerHTML={{ __html: sheetCss + ledgerCss }} />
      <div className="col">
        <header className="masthead">
          <h1>Users</h1>
          <div className="meta">
            <span className="mono num">
              {data.length} {data.length === 1 ? "account" : "accounts"}
            </span>
            <Link className="back mono" href="/admin">
              ← Admin
            </Link>
          </div>
        </header>

        {data.length === 0 ? (
          <p className="lede">Nobody has signed up yet.</p>
        ) : (
          <>
            <div className="find">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a name or address"
                aria-label="Find a name or address"
                autoComplete="off"
              />
              {query && found > 0 && (
                <span className="tally" aria-live="polite">
                  {found} found
                </span>
              )}
            </div>

            {sections.length === 0 ? (
              <p className="lede">No account matches “{query}”.</p>
            ) : (
              sections.map((section) => (
                <Fragment key={section.key}>
                  <h2 className="kicker">
                    <span>
                      {section.head}
                      <span className="aside num">
                        {" · "}
                        {section.users.length}
                      </span>
                    </span>
                  </h2>
                  <div
                    className="dir"
                    style={
                      {
                        "--rows": Math.ceil(section.users.length / 2),
                      } as CSSProperties
                    }
                  >
                    {section.users.map((user) => (
                      <div
                        key={user.id}
                        className={[
                          "acct",
                          user.deactivated_at ? "off" : "",
                          user.id === currentUserId ? "mine" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <UserNameCell
                          user={user}
                          isViewer={user.id === currentUserId}
                          // Everywhere else the group heading says who is an
                          // admin. Here it says they are closed instead, so the
                          // entry has to carry the fact the heading dropped.
                          showAdminMark={section.key === "deactivated"}
                        />
                        <UserActionsCell user={user} />
                      </div>
                    ))}
                  </div>
                </Fragment>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
