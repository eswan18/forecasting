import { StopSheet } from "@/components/stop-sheet/stop-sheet";

export default function NotFound() {
  return (
    <StopSheet
      code="404"
      title="Page not found"
      message="We couldn't find the page you were looking for. It may have been resolved, renamed, or never existed."
    />
  );
}
