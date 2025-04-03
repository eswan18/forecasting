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
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

export default function DatePicker({ value, onChange, timeZone }: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  timeZone?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value
            ? formatInTimeZone(value, timeZone || "UTC", "PPP")
            : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(val) => {
            onChange(val);
            setOpen(false);
          }}
          autoFocus
          timeZone={timeZone}
        />
      </PopoverContent>
    </Popover>
  );
}
