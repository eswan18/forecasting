import { StopSheet } from "@/components/stop-sheet/stop-sheet";

/**
 * A page that could not be built: a failed query, a missing record, a bad id.
 *
 * `title` is what went wrong in the caller's own words — usually the message a
 * server action returned — so it stays the headline rather than being buried
 * under a generic one.
 */
export default function ErrorPage({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <StopSheet code="Error" title={title}>
      {children}
    </StopSheet>
  );
}
