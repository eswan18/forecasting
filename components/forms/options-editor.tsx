"use client";

import { MAX_OPTIONS, MAX_OPTION_LENGTH, MIN_OPTIONS } from "@/lib/prop-kind";

interface OptionsEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  /** Validation messages for the option list as a whole. */
  errors?: string[];
  /**
   * Id of the element naming this group. There is no single labelable control
   * here — a form label has nothing to point `htmlFor` at, so the group names
   * itself instead.
   */
  ariaLabelledBy?: string;
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
  ariaLabelledBy,
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
    <div className="opts" role="group" aria-labelledby={ariaLabelledBy}>
      {value.map((option, index) => (
        <div className="row" key={index}>
          <span className="n" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <input
            type="text"
            value={option}
            onChange={(e) => setOption(index, e.target.value)}
            disabled={disabled}
            maxLength={MAX_OPTION_LENGTH}
            placeholder={`Option ${index + 1}`}
            aria-label={`Option ${index + 1}`}
          />
          <button
            type="button"
            className="drop"
            disabled={!canRemove}
            onClick={() => removeOption(index)}
            title={
              canRemove
                ? `Remove option ${index + 1}`
                : `At least ${MIN_OPTIONS} options are required`
            }
            aria-label={`Remove option ${index + 1}`}
          >
            ×
          </button>
        </div>
      ))}

      <div className="foot">
        <button
          type="button"
          className="add"
          disabled={!canAdd}
          onClick={() => onChange([...value, ""])}
        >
          + Add option
        </button>
        <span className="count">
          {value.length}/{MAX_OPTIONS}
        </span>
      </div>

      {errors.length > 0 && (
        <div role="alert">
          {errors.map((error, index) => (
            <p className="bad-msg" key={index}>
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
