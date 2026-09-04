import { LoadingSheet } from "@/components/stop-sheet/loading-sheet";

/**
 * A whole page waiting on its data.
 *
 * `text` is kept for the screen-reader announcement; the sheet itself shows
 * the shape of what is coming rather than a spinner and a word.
 */
export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return <LoadingSheet label={text} />;
}
