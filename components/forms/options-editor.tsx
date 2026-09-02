"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_OPTIONS, MAX_OPTION_LENGTH, MIN_OPTIONS } from "@/lib/prop-kind";

interface OptionsEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  /** Validation messages for the option list as a whole. */
  errors?: string[];
}

/**
 * Controlled editor for a choice prop's option labels. Order is position, so
 * rows are numbered and add/remove keep the list order intact.
 */
export function OptionsEditor({
  value,
  onChange,
  disabled = false,
  errors = [],
}: OptionsEditorProps) {
  const canRemove = !disabled && value.length > MIN_OPTIONS;
  const canAdd = !disabled && value.length < MAX_OPTIONS;

  function setOption(index: number, text: string) {
    onChange(value.map((option, i) => (i === index ? text : option)));
  }

  function removeOption(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {value.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-5 shrink-0 font-mono text-[10px] font-medium uppercase tracking-[0.12em] tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <Input
              value={option}
              onChange={(e) => setOption(index, e.target.value)}
              disabled={disabled}
              maxLength={MAX_OPTION_LENGTH}
              placeholder={`Option ${index + 1}`}
              aria-label={`Option ${index + 1}`}
              className="shadow-none"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              disabled={!canRemove}
              onClick={() => removeOption(index)}
              title={
                canRemove
                  ? `Remove option ${index + 1}`
                  : `At least ${MIN_OPTIONS} options are required`
              }
              aria-label={`Remove option ${index + 1}`}
            >
              <X />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          disabled={!canAdd}
          onClick={() => onChange([...value, ""])}
        >
          <Plus />
          Add option
        </Button>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {value.length} / {MAX_OPTIONS}
        </span>
      </div>

      {errors.length > 0 && (
        <div className="space-y-1" role="alert">
          {errors.map((error, index) => (
            <p key={index} className="text-xs text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
