import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Shared page container. Constrains content to a consistent max width and
 * horizontal padding so the navbar and page content share a left edge.
 */
function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}

export { Container };
