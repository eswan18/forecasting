"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VProp } from "@/types/db_types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { ResolutionDialog } from "@/components/dialogs/resolution-dialog";
import { MarkdownRenderer } from "@/components/markdown";

interface PropPageHeaderProps {
  prop: VProp;
  canResolve: boolean;
}

export default function PropPageHeader({
  prop,
  canResolve,
}: PropPageHeaderProps) {
  const router = useRouter();
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);

  return (
    <>
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {prop.category_name && (
              <Badge variant="secondary" className="text-xs">
                {prop.category_name}
              </Badge>
            )}
            <Badge
              variant={
                prop.resolution === null
                  ? "outline"
                  : prop.resolution
                    ? "default"
                    : "destructive"
              }
              className="text-xs"
            >
              {prop.resolution === null
                ? "Unresolved"
                : prop.resolution
                  ? "Yes"
                  : "No"}
            </Badge>
          </div>
          {canResolve && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResolutionDialogOpen(true)}
              className="shrink-0"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Resolve
            </Button>
          )}
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          <MarkdownRenderer>{prop.prop_text}</MarkdownRenderer>
        </h1>
        {prop.prop_notes && (
          <p className="text-muted-foreground">
            <MarkdownRenderer>{prop.prop_notes}</MarkdownRenderer>
          </p>
        )}
        {prop.resolution_notes && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground/70 mb-1">
              Resolution Notes
            </p>
            <p className="text-sm text-muted-foreground">
              <MarkdownRenderer>{prop.resolution_notes}</MarkdownRenderer>
            </p>
          </div>
        )}
      </div>

      <ResolutionDialog
        prop={prop}
        isOpen={isResolutionDialogOpen}
        onClose={() => setIsResolutionDialogOpen(false)}
      />
    </>
  );
}
