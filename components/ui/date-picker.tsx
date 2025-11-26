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
import { ChevronDownIcon } from "lucide-react";

export default function DatePicker({
  value,
  onChange,
  timeZone,
}: {
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
            "w-[240px] justify-between text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          {value ? (
            formatInTimeZone(value, timeZone || "UTC", "PPP")
          ) : (
            <span>Pick a date</span>
          )}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          captionLayout="dropdown"
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
