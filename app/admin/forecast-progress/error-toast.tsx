"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * Says once, out loud, what the sheet also prints: some rows are missing.
 * The sheet marks the affected forecasters "no data" and leaves their counts
 * and their place on the axis blank, so the wording points there rather than
 * explaining away a row of zeroes.
 */
export function ErrorToast({ hasErrors }: { hasErrors: boolean }) {
  const { toast } = useToast();

  useEffect(() => {
    if (hasErrors) {
      toast({
        title: "Partial Data Loaded",
        description:
          "Some user data could not be loaded. Affected users are marked 'no data' below. Check server logs for details.",
        variant: "destructive",
      });
    }
  }, [hasErrors, toast]);

  return null;
}
