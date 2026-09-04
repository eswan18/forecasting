import { LoadingSheet } from "@/components/stop-sheet/loading-sheet";

/**
 * Few rows, and each one wide: a flag, its default, and who is excepted.
 */
export default function Loading() {
  return <LoadingSheet rows={3} label="Loading feature flags" />;
}
