import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createSortedRowModel,
  filterFns,
  rowSortingFeature,
  sortFns,
  tableFeatures,
} from "@tanstack/react-table";

/**
 * Feature set for the admin users table.
 *
 * TanStack Table v9 replaced v8's per-call `getSortedRowModel()` /
 * `getFilteredRowModel()` options with a single up-front `features` object, and
 * threads that object's *type* through `ColumnDef`, `Row`, and `Cell` as their
 * leading generic. The columns and the table therefore have to agree on one
 * shared value, so it lives here rather than inline in either file.
 */
export const usersTableFeatures = tableFeatures({
  columnFilteringFeature,
  // Required for row.getVisibleCells(); the table has no visibility toggles.
  columnVisibilityFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns,
  sortFns,
});

export type UsersTableFeatures = typeof usersTableFeatures;
