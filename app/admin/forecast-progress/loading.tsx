import { LoadingSheet } from "@/components/stop-sheet/loading-sheet";

/**
 * The sheet's frame while the per-forecaster counts are gathered — one query
 * per user, so this is a wait worth showing the shape of rather than spinning
 * at. Six rows, which is about a pool's worth of forecasters.
 */
export default function Loading() {
  return <LoadingSheet rows={6} label="Loading forecast progress" />;
}
