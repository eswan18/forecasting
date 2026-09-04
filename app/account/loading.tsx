import { LoadingSheet } from "@/components/stop-sheet/loading-sheet";

/**
 * A short sheet: who you are, and the few things you can change.
 */
export default function Loading() {
  return <LoadingSheet rows={3} label="Loading your account" />;
}
