import { LoadingSheet } from "@/components/stop-sheet/loading-sheet";

/**
 * A row per account, so the skeleton is a column of them.
 */
export default function Loading() {
  return <LoadingSheet rows={6} label="Loading users" />;
}
