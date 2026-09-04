import { LoadingSheet } from "@/components/stop-sheet/loading-sheet";

/**
 * Your own props, and the form for writing another. Both are a masthead over a
 * ruled column, so the same skeleton stands in for either.
 */
export default function Loading() {
  return <LoadingSheet rows={5} label="Loading your props" />;
}
