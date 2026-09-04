"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  ColumnFiltersState,
  flexRender,
  SortingState,
  useTable,
} from "@tanstack/react-table";

import { sheetCss } from "@/components/prop-list/sheet";
import { VUser } from "@/types/db_types";

import { getColumns } from "./columns";
import { usersTableFeatures } from "./table-features";
import { userMarksCss } from "./user-badges";

/**
 * One grid for the whole ledger, the way the competitions list sets its
 * seasons: the rows hand their cells straight to the page's grid, so the two
 * mark columns line up down the length of a list that gains a row every time
 * somebody signs up.
 *
 * Module-level constant, no interpolation: this is a stylesheet, not content.
 */
const ownCss = `
/* The one control the page has, set the way every other control on the sheets
   is set: on a rule, not in a box. */
.hxp .find {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1.5rem;
  padding-top: 1.75rem;
}
.hxp .find input {
  flex: 0 1 22rem;
  min-width: 0;
  font-family: var(--font-archivo), ui-sans-serif, system-ui, sans-serif;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--ink);
  background: none;
  border: 0;
  border-bottom: 1px solid var(--rule);
  padding: 0 0 0.375rem;
  outline: none;
}
.hxp .find input:focus { border-bottom-color: var(--ink); }
.hxp .find input::placeholder { color: var(--ink-faint); }
.hxp .find .tally {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: var(--ink-faint);
  white-space: nowrap;
}

.hxp .ledger {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 5.5rem 7.5rem 2rem;
  /* No column gap: every cell draws its own share of the row's hairline, and a
     gap would break that one rule into four pieces. The air between columns is
     padding inside them instead. */
  gap: 0;
  align-items: stretch;
}
.hxp .ledger > * { display: contents; }

.hxp .ledgerhead > * {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-muted);
  padding: 1.75rem 0 0.5rem;
  border-bottom: 1px solid var(--rule);
}
.hxp .ledgerhead > .h-role,
.hxp .ledgerhead > .h-access,
.hxp .acct > .role,
.hxp .acct > .access { padding-left: 1.5rem; }

/* The column head is the control: it names the column and points at the
   direction, so there is no separate widget to explain. */
.hxp .ledgerhead .sort {
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: inherit;
  background: none;
  border: 0;
  border-bottom: 1px solid transparent;
  padding: 0 0 0.125rem;
  cursor: pointer;
  white-space: nowrap;
}
.hxp .ledgerhead .sort:hover {
  color: var(--red-text);
  border-bottom-color: var(--red-text);
}
.hxp .ledgerhead .sort.on { color: var(--ink); }
.hxp .ledgerhead .sort .arrow { margin-left: 0.375rem; }

.hxp .acct > * {
  padding: 0.75rem 0;
  /* one line box for every cell, so a mark and the name beside it sit on one
     baseline despite the difference in size */
  line-height: 1.5rem;
  border-bottom: 1px solid var(--rule);
}
.hxp .acct .who { min-width: 0; }
.hxp .acct .who .nm { font-size: 0.9375rem; }
.hxp .acct .who .nm a { color: inherit; text-decoration: none; }
.hxp .acct:hover .who .nm a {
  color: var(--red-text);
  border-bottom: 1px solid var(--red-text);
}
.hxp .acct .who .em {
  display: block;
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 0.6875rem;
  color: var(--ink-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-top: 0.125rem;
}
/* A closed account is struck from the ledger rather than shouted at: the whole
   entry goes pale, and the word in the Access column says why. */
.hxp .acct.off .who .nm,
.hxp .acct.off .who .em { color: var(--ink-faint); }
/* The reader's own row is marked once, in the ink that means the reader
   everywhere else on the sheets. It is placed after the pale rule above so it
   still reads as you even on an account somebody has closed. */
.hxp .acct.mine .who .nm { font-weight: 700; color: var(--red-text); }

/* the marks only the narrow layout shows, under the address */
.hxp .acct .who .marks { display: none; }

.hxp .acct .rowact { text-align: right; }
.hxp .acct .menu {
  font-family: var(--font-roboto-mono), ui-monospace, monospace;
  font-size: 1rem;
  line-height: 1;
  color: var(--ink-faint);
  background: none;
  border: 0;
  padding: 0.125rem 0 0.125rem 0.375rem;
  cursor: pointer;
}
.hxp .acct .menu:hover:not(:disabled) { color: var(--red-text); }
.hxp .acct .menu:disabled { cursor: default; opacity: 0.5; }
/* the trigger keeps focus when its menu closes; the UA ring is blue */
.hxp .acct .menu:focus-visible {
  outline: 2px solid var(--red-text);
  outline-offset: 1px;
}

@media (max-width: 46rem) {
  /* The two mark columns fold into the account they describe, so the name and
     the address keep the width they need on a phone. */
  .hxp .ledger { grid-template-columns: minmax(0, 1fr) 2rem; }
  .hxp .ledgerhead > .h-role,
  .hxp .ledgerhead > .h-access,
  .hxp .acct > .role,
  .hxp .acct > .access { display: none; }
  .hxp .acct .who .marks { display: block; padding-top: 0.25rem; }
  /* an unremarkable account still says nothing at all */
  .hxp .acct .who .marks:empty { display: none; }
  .hxp .find { flex-wrap: wrap; }
  .hxp .find input { flex: 1 1 100%; }
}
`;

/**
 * Every account, as a ledger.
 *
 * Sorting and filtering are the table's own: the column heads are the sort
 * controls, and the one search box filters the account column, which reads the
 * name and the address together.
 */
export default function UsersTable({
  data,
  currentUserId,
}: {
  data: VUser[];
  /** Whose row prints in red. Null when the viewer cannot be resolved. */
  currentUserId?: number | null;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columns] = useState(() => getColumns());
  const table = useTable({
    features: usersTableFeatures,
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  });

  const accountColumn = table.getColumn("account");
  const query = (accountColumn?.getFilterValue() as string | undefined) ?? "";
  const rows = table.getRowModel().rows;

  return (
    <div className="hxp">
      <style
        dangerouslySetInnerHTML={{ __html: sheetCss + userMarksCss + ownCss }}
      />
      <div className="col">
        <header className="masthead">
          <h1>Users</h1>
        </header>

        <h2 className="kicker">
          <span>
            All accounts
            <span className="aside num"> · {data.length}</span>
          </span>
          <Link className="aside" href="/admin">
            ← Admin
          </Link>
        </h2>

        {data.length === 0 ? (
          <p className="lede">Nobody has signed up yet.</p>
        ) : (
          <>
            <div className="find">
              <input
                type="text"
                value={query}
                onChange={(e) => accountColumn?.setFilterValue(e.target.value)}
                placeholder="Find a name or address"
                aria-label="Find an account"
                autoComplete="off"
              />
              {query && (
                <span className="tally">
                  {rows.length === 0 ? "No match" : `${rows.length} found`}
                </span>
              )}
            </div>

            {rows.length === 0 ? (
              <p className="lede">No account matches “{query}”.</p>
            ) : (
              <div className="ledger">
                <div className="ledgerhead">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Fragment key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const sorted = header.column.getIsSorted();
                        const label = header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            );
                        return (
                          <span
                            key={header.id}
                            className={`h-${header.column.id}`}
                          >
                            {header.column.getCanSort() ? (
                              <button
                                type="button"
                                className={sorted ? "sort on" : "sort"}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {label}
                                <span className="arrow" aria-hidden="true">
                                  {sorted === "asc"
                                    ? "↑"
                                    : sorted === "desc"
                                      ? "↓"
                                      : ""}
                                </span>
                              </button>
                            ) : (
                              label
                            )}
                          </span>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>

                {rows.map((row) => (
                  <div
                    key={row.id}
                    className={[
                      "acct",
                      row.original.deactivated_at ? "off" : "",
                      row.original.id === currentUserId ? "mine" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <Fragment key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </Fragment>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
