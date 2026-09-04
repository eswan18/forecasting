import { LoadingSheet } from "@/components/stop-sheet/loading-sheet";

/**
 * What readers have proposed, waiting to be read.
 */
export default function Loading() {
  return <LoadingSheet rows={4} label="Loading suggestions" />;
}
