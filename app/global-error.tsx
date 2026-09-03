"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { StopSheet } from "@/components/stop-sheet/stop-sheet";

/**
 * The last boundary: this replaces the root layout, so it renders its own
 * document and can assume nothing about the app's fonts or global stylesheet.
 * `StopSheet` carries its own styles and falls back to literal colours and
 * system font stacks for exactly this case.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <StopSheet
          code="Error"
          title="The app failed to load"
          message="Something went wrong before the page could be built. The failure has been reported."
          detail={error.digest && `Reference ${error.digest}`}
          actions={[{ label: "Return home", href: "/", primary: true }]}
        />
      </body>
    </html>
  );
}
