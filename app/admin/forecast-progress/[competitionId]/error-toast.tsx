"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function ErrorToast({ hasErrors }: { hasErrors: boolean }) {
  const { toast } = useToast();

  useEffect(() => {
    if (hasErrors) {
      toast({
        title: "Partial Data Loaded",
        description:
          "Some user data could not be loaded. Affected users will show 0 counts. Check server logs for details.",
        variant: "destructive",
      });
    }
  }, [hasErrors, toast]);

  return null;
}
