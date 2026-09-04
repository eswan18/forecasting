"use client"; // Error boundaries must be Client Components

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { StopSheet } from "@/components/stop-sheet/stop-sheet";

/**
 * The route-level boundary. Until this existed, anything a page threw fell all
 * the way to `global-error`, which replaces the whole document — so a failure
 * in one route took the navbar with it and offered nothing but Next's default
 * error page. This keeps the reader inside the app, and gives them the one
 * thing that often works: try again.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <StopSheet
      code="Error"
      title="Something went wrong"
      message="This page didn't load. The failure has been reported."
      detail={error.digest && `Reference ${error.digest}`}
      actions={[
        { label: "Try again", onClick: reset, primary: true },
        { label: "Return home", href: "/" },
      ]}
    />
  );
}
