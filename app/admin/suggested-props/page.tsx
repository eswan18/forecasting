"use client";

import { useState, useEffect } from "react";
import PageHeading from "@/components/page-heading";
import { getSuggestedProps, deleteSuggestedProp } from "@/lib/db_actions";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Trash } from "lucide-react";
import { VSuggestedProp } from "@/types/db_types";
import {
  useServerAction,
  useServerActionNoParams,
} from "@/hooks/use-server-action";
import { MarkdownRenderer } from "@/components/markdown";

// Helper function to parse prop text and notes
function parsePropText(propText: string) {
  const notesMatch = propText.match(/\n\nNotes: ([\s\S]+)$/);
  if (notesMatch) {
    return {
      mainText: propText.replace(/\n\nNotes: [\s\S]+$/, "").trim(),
      notes: notesMatch[1].trim(),
    };
  }
  return {
    mainText: propText.trim(),
    notes: null,
  };
}

export default function SuggestedProps() {
  const [suggestedProps, setSuggestedProps] = useState<VSuggestedProp[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propToDelete, setPropToDelete] = useState<number | null>(null);

  const getSuggestedPropsAction = useServerActionNoParams(getSuggestedProps, {
    showToast: false,
    onSuccess: (data) => {
      setSuggestedProps(data);
    },
  });

  const deleteSuggestedPropAction = useServerAction(deleteSuggestedProp, {
    successMessage: "Suggested prop deleted!",
    onSuccess: () => {
      if (propToDelete) {
        setSuggestedProps((prev) =>
          prev.filter((prop) => prop.id !== propToDelete),
        );
        setDeleteDialogOpen(false);
        setPropToDelete(null);
      }
    },
  });

  // Load suggested props on component mount
  useEffect(() => {
    getSuggestedPropsAction.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run once on mount to avoid infinite loop
  }, []);

  const loading = getSuggestedPropsAction.isLoading;
  const isLoadingDelete = deleteSuggestedPropAction.isLoading;

  const handleDeleteProp = async () => {
    if (!propToDelete) return;
    await deleteSuggestedPropAction.execute({ id: propToDelete });
  };

  const openDeleteDialog = (propId: number) => {
    setPropToDelete(propId);
    setDeleteDialogOpen(true);
  };

  return (
    <main className="py-10 lg:py-14">
      <Container className="max-w-3xl">
        <PageHeading
          title="Suggested Props"
          subtitle="Review propositions submitted by forecasters."
          breadcrumbs={{
            Admin: "/admin",
          }}
        />

        {loading ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Spinner className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Loading suggested props…
            </p>
          </div>
        ) : suggestedProps.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-sm font-medium text-foreground">
              No suggested props
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              No propositions have been suggested yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestedProps.map((prop) => {
              const { mainText, notes } = parsePropText(prop.prop_text);

              return (
                <div
                  key={prop.id}
                  className="rounded-lg border bg-card p-5 transition-colors hover:border-foreground/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-medium leading-relaxed text-foreground">
                        <MarkdownRenderer>{mainText}</MarkdownRenderer>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>{prop.user_name}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => openDeleteDialog(prop.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                  {notes && (
                    <div className="mt-4 border-t pt-4">
                      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Notes
                      </div>
                      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        <MarkdownRenderer>{notes}</MarkdownRenderer>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Suggested Prop</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this suggested prop? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProp}
                disabled={isLoadingDelete}
              >
                {isLoadingDelete ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Container>
    </main>
  );
}
