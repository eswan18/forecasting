import { LoadingSheet } from "@/components/stop-sheet/loading-sheet";

/**
 * The slowest sheet in the app: it counts every prop and every resolution for
 * every competition before the first row can be printed.
 */
export default function Loading() {
  return <LoadingSheet rows={5} label="Loading competitions" />;
}
