"use client";

import { useState, useEffect } from "react";
import PageHeading from "@/components/page-heading";
import { getSuggestedProps, deleteSuggestedProp } from "@/lib/db_actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  Trash,
} from "lucide-react";

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
  const [suggestedProps, setSuggestedProps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propToDelete, setPropToDelete] = useState<number | null>(null);

  // Load suggested props on component mount
  useEffect(() => {
    const loadProps = async () => {
      try {
        const props = await getSuggestedProps();
        setSuggestedProps(props);
      } catch (error) {
        console.error("Failed to load suggested props:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProps();
  }, []);

  const handleDeleteProp = async () => {
    if (!propToDelete) return;

    try {
      await deleteSuggestedProp({ id: propToDelete });
      setSuggestedProps((prev) =>
        prev.filter((prop) => prop.id !== propToDelete),
      );
      setDeleteDialogOpen(false);
      setPropToDelete(null);
    } catch (error) {
      console.error("Failed to delete suggested prop:", error);
    }
  };

  const openDeleteDialog = (propId: number) => {
    setPropToDelete(propId);
    setDeleteDialogOpen(true);
  };

  return (
    <main className="flex flex-col items-center justify-between py-8 px-8 lg:py-12 lg:px-24">
      <div className="w-full max-w-4xl">
        <PageHeading title="Suggested Props" />

        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">
                Loading suggested props...
              </p>
            </CardContent>
          </Card>
        ) : suggestedProps.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No suggested props</h3>
              <p className="text-muted-foreground">
                No propositions have been suggested yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {suggestedProps.map((prop) => {
              const { mainText, notes } = parsePropText(prop.prop_text);

              return (
                <Card
                  key={prop.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-relaxed mb-3">
                          {mainText}
                        </CardTitle>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span className="font-medium">
                              {prop.user_name}
                            </span>
                            {prop.user_username && (
                              <span className="text-muted-foreground">
                                (@{prop.user_username})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                        onClick={() => openDeleteDialog(prop.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  {notes && (
                    <CardContent className="pt-0">
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            Additional Notes
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                          {notes}
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
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
              <Button variant="destructive" onClick={handleDeleteProp}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
