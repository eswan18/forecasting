"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { PropEditDialog } from "@/components/dialogs/prop-edit-dialog";
import { MarkdownRenderer } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PROP_KIND_LABELS } from "@/lib/prop-kind";
import { cn, focusRing } from "@/lib/utils";
import type { PropWithUserForecast } from "@/types/db_types";

import { ChoiceForecastEditor } from "./choice-forecast-editor";
import { useChoiceForecastEntry } from "./use-choice-forecast-entry";

interface EditableChoiceForecastCardProps {
  prop: PropWithUserForecast;
  onForecastUpdate?: () => void;
}

/**
 * The `EditableForecastCard` for a choice prop: the same header and
 * changed-card ring as the binary card, but the needle and single % box give
 * way to a full-width row-per-option editor. Rendered by
 * `EditableForecastCard`, which branches on the prop kind — don't reach for it
 * directly.
 */
export function EditableChoiceForecastCard({
  prop,
  onForecastUpdate,
}: EditableChoiceForecastCardProps) {
  const { user } = useCurrentUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { kind, values, setValue, hasChanges, canSave, isSaving, save, cancel } =
    useChoiceForecastEntry(prop, { onSaved: onForecastUpdate });

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-5 transition-all",
        hasChanges
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-border hover:border-muted-foreground/30",
      )}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <Badge variant="secondary" className="text-xs font-medium">
          {prop.category_name}
        </Badge>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {PROP_KIND_LABELS[kind]}
        </span>
      </div>

      <div className="flex w-fit items-center gap-5">
        <div className="min-w-0">
          <h3 className="font-medium leading-snug text-foreground">
            <MarkdownRenderer>{prop.prop_text}</MarkdownRenderer>
          </h3>
          <p className="text-sm text-muted-foreground">
            {prop.prop_notes || " "}
          </p>
        </div>
        {user?.is_admin && (
          <button
            type="button"
            onClick={() => setIsEditDialogOpen(true)}
            aria-label="Edit prop"
            className={cn(
              "shrink-0 rounded-sm text-muted-foreground hover:text-foreground",
              focusRing,
            )}
          >
            <Pencil className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mt-3">
        <ChoiceForecastEditor
          kind={kind}
          options={prop.options}
          values={values}
          onChange={setValue}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          onClick={save}
          disabled={!hasChanges || !canSave || isSaving}
          size="sm"
          className="px-3"
        >
          {isSaving ? <Spinner className="h-3 w-3" /> : "Save forecast"}
        </Button>
        <Button
          onClick={cancel}
          variant="ghost"
          size="sm"
          disabled={!hasChanges || isSaving}
        >
          Cancel
        </Button>
      </div>

      {/* Mounted only while open, so the dialog's `useState` initialisers
          re-seed from the prop each time it is opened. */}
      {user?.is_admin && isEditDialogOpen && (
        <PropEditDialog
          prop={prop}
          isOpen
          onClose={() => {
            setIsEditDialogOpen(false);
            onForecastUpdate?.();
          }}
        />
      )}
    </div>
  );
}
