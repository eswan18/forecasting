"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";

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
  placeholder = "Pick a date and time",
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
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            formatInTimeZone(value, timeZone, "PPP 'at' HH:mm") + " UTC"
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          autoFocus
          timeZone={timeZone}
        />
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Time (UTC):</span>
            <Input
              type="number"
              min="0"
              max="23"
              value={hours}
              onChange={(e) => handleTimeChange("hours", e.target.value)}
              className="w-16 text-center"
            />
            <span className="text-muted-foreground">:</span>
            <Input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => handleTimeChange("minutes", e.target.value)}
              className="w-16 text-center"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
