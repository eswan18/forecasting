"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * A date field in the form vocabulary: the trigger is the same `.picker`
 * button the other choosers use, so it sits on the field's rule rather than
 * floating as a rounded plate. Styling comes from the enclosing `.hxf`; the
 * calendar's own is `.riso-cal` in globals.css.
 */
export default function DatePicker({
  value,
  onChange,
  timeZone,
  placeholder = "No date set",
  disabled = false,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  timeZone?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="picker" disabled={disabled}>
          {value ? (
            formatInTimeZone(value, timeZone || "UTC", "d MMM yyyy")
          ) : (
            <span className="none">{placeholder}</span>
          )}
          <span className="car" aria-hidden="true">
            ▾
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          className="riso-cal"
          classNames={{ today: "riso-today" }}
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          autoFocus
          timeZone={timeZone}
        />
      </PopoverContent>
    </Popover>
  );
}
