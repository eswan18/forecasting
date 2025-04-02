"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";

interface DatePickerProps {
  selected?: Date;
  onChange: (date: Date | undefined) => void;
}

export function DatePicker({ selected, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Input
          readOnly
          value={selected ? format(selected, "yyyy-MM-dd ' @  00:00 UTC'") : ""}
          placeholder="Select a date"
          className="text-left"
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
