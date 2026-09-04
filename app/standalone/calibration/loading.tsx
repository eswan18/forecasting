import { LoadingSheet } from "@/components/stop-sheet/loading-sheet";

/**
 * Every forecast you have ever made is read and bucketed before the chart can
 * be drawn, so this is a wait worth showing the shape of.
 */
export default function Loading() {
  return <LoadingSheet rows={4} label="Loading your calibration" />;
}
