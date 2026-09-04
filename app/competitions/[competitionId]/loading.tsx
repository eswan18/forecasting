import { LoadingSheet } from "@/components/stop-sheet/loading-sheet";

/**
 * The whole competition subtree: the overview, the standings, the three prop
 * lists, the members roster and a forecaster's scores. Every one of them opens
 * with a masthead and a ruled list, so one shape serves them all — and the
 * overview is the slowest page in the app, since it counts scores for the
 * season before it can print anything.
 */
export default function Loading() {
  return <LoadingSheet rows={5} label="Loading competition" />;
}
