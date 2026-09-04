"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  timeZone?: string;
  placeholder?: string;
}

export function DateTimePicker({
  value,
  onChange,
  timeZone = "UTC",
  placeholder = "No date set",
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  // Extract hours and minutes from the current value
  const hours = value ? value.getUTCHours().toString().padStart(2, "0") : "12";
  const minutes = value
    ? value.getUTCMinutes().toString().padStart(2, "0")
    : "00";

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Preserve the current time when changing the date
      const newDate = new Date(date);
      if (value) {
        newDate.setUTCHours(value.getUTCHours(), value.getUTCMinutes(), 0, 0);
      } else {
        // Default to noon UTC
        newDate.setUTCHours(12, 0, 0, 0);
      }
      onChange(newDate);
    } else {
      onChange(undefined);
    }
  };

  const handleTimeChange = (type: "hours" | "minutes", val: string) => {
    if (!value) {
      // If no date is set, create one for today
      const today = new Date();
      today.setUTCHours(12, 0, 0, 0);
      onChange(today);
      return;
    }

    const newDate = new Date(value);
    const numVal = parseInt(val, 10);

    if (isNaN(numVal)) return;

    if (type === "hours") {
      if (numVal >= 0 && numVal <= 23) {
        newDate.setUTCHours(numVal);
        onChange(newDate);
      }
    } else {
      if (numVal >= 0 && numVal <= 59) {
        newDate.setUTCMinutes(numVal);
        onChange(newDate);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="picker">
          {value ? (
            formatInTimeZone(value, timeZone, "d MMM yyyy 'at' HH:mm") + " UTC"
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
          onSelect={handleDateSelect}
          autoFocus
          timeZone={timeZone}
        />
        <div className="riso-clock">
          <span>Time · UTC</span>
          <input
            type="number"
            min="0"
            max="23"
            value={hours}
            aria-label="Hour, UTC"
            onChange={(e) => handleTimeChange("hours", e.target.value)}
          />
          <span aria-hidden="true">:</span>
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            aria-label="Minute, UTC"
            onChange={(e) => handleTimeChange("minutes", e.target.value)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
