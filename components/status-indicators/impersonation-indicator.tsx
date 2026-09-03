"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { stopImpersonation } from "@/lib/auth/impersonation";
import { toast } from "@/hooks/use-toast";
import { StatusIndicator } from "./status-indicator";

interface ImpersonationIndicatorProps {
  impersonatedName: string;
}

export function ImpersonationIndicator({
  impersonatedName,
}: ImpersonationIndicatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStopImpersonation = async () => {
    setIsLoading(true);
    try {
      await stopImpersonation();
      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      console.error("Failed to stop impersonation:", error);
      toast({
        title: "Error",
        description: "Failed to stop impersonation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StatusIndicator variant="warning">
      <div className="flex items-center justify-center gap-3">
        <span>
          Viewing as <strong>{impersonatedName}</strong>
        </span>
        <button
          type="button"
          className="riso-banner-act"
          onClick={handleStopImpersonation}
          disabled={isLoading}
        >
          {isLoading ? "Stopping…" : "Stop impersonating"}
        </button>
      </div>
    </StatusIndicator>
  );
}
