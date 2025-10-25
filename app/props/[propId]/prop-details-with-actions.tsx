"use client";

import { useState } from "react";
import { VProp } from "@/types/db_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { ResolutionDialog } from "@/components/dialogs/resolution-dialog";

interface PropDetailsWithActionsProps {
  prop: VProp;
  canResolve: boolean;
}

export default function PropDetailsWithActions({
  prop,
  canResolve,
}: PropDetailsWithActionsProps) {
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{prop.prop_text}</CardTitle>
              <div className="flex gap-2 flex-wrap mt-2">
                {prop.category_name && (
                  <Badge variant="secondary">{prop.category_name}</Badge>
                )}
                <Badge
                  variant={prop.resolution === null ? "outline" : "default"}
                >
                  {prop.resolution === null
                    ? "Unresolved"
                    : prop.resolution
                      ? "True"
                      : "False"}
                </Badge>
              </div>
            </div>
            {canResolve && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResolutionDialogOpen(true)}
                className="ml-4 flex-shrink-0"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Resolve
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {prop.prop_notes && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {prop.prop_notes}
              </p>
            </div>
          )}
          {prop.resolution_notes && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground/70 mb-1">
                Resolution Notes
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {prop.resolution_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ResolutionDialog
        prop={prop}
        isOpen={isResolutionDialogOpen}
        onClose={() => setIsResolutionDialogOpen(false)}
      />
    </>
  );
}
