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

interface User {
  id: number;
  name: string;
}

export default function YearSelector(
  { years, selectedYear }: { years: number[]; selectedYear: number },
) {
  return (
    <div className="flex flex-row gap-2 mt-2">
      <Select
        value={String(selectedYear.toString())}
        onValueChange={(year) => {
          redirect(`/props/${year}`);
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
