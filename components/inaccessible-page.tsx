import { StopSheet } from "@/components/stop-sheet/stop-sheet";

/** A page the reader is not allowed to see: a private competition, or one that has not opened. */
export async function InaccessiblePage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return <StopSheet code="Locked" title={title} message={message} />;
}
