"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { redirect } from "next/navigation";

export default function UserYearSelector(
  { years, selectedYear }: {
    years: number[];
    selectedYear: number;
  },
) {
  return (
    <div className="-translate-y-1">
      <Select
        value={String(selectedYear.toString())}
        onValueChange={(year) => {
          redirect(`/forecasts/${year}`);
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder={selectedYear} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Years</SelectLabel>
            {years.map((year) => (
              <SelectItem
                key={year}
                value={year.toString()}
              >
                {year}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
