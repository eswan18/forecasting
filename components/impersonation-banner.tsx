"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { stopImpersonation } from "@/lib/auth/impersonation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ImpersonationBannerProps {
  impersonatedUsername: string;
  impersonatedName: string;
}

export function ImpersonationBanner({
  impersonatedUsername,
  impersonatedName,
}: ImpersonationBannerProps) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = impersonatedUsername || impersonatedName;

  return (
    <div className="bg-amber-500 text-black text-center text-sm font-medium py-2 w-full flex items-center justify-center gap-3">
      <span>
        Viewing as <strong>{displayName}</strong>
      </span>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleStopImpersonation}
        disabled={isLoading}
        className="h-6 px-2 text-xs"
      >
        {isLoading ? (
          "Stopping..."
        ) : (
          <>
            <X className="h-3 w-3 mr-1" />
            Stop Impersonating
          </>
        )}
      </Button>
    </div>
  );
}
