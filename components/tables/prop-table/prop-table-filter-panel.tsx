"use client";
import type { PropTableSearchParams } from "./table";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export default function PropTableFilterPanel({
  filter,
  setFilter,
}: {
  filter: PropTableSearchParams;
  setFilter: (
    filter:
      | PropTableSearchParams
      | ((p: PropTableSearchParams) => PropTableSearchParams),
  ) => void;
}) {
  const [propText, setPropText] = useState(filter.propText || "");
  useEffect(() => {
    // Debounce the propText input.
    const handler = setTimeout(() => {
      setFilter((prev: PropTableSearchParams) => ({ ...prev, propText }));
    }, 400);
    return () => clearTimeout(handler);
  }, [propText, setFilter]);

  const handleCheck = (checked: boolean) => {
    if (checked) {
      // Remove null from the filter.
      setFilter((prev) => ({
        ...prev,
        resolution: prev.resolution.filter((value) => value !== null),
      }));
    } else {
      // Add null to the filter
      setFilter((prev) => ({
        ...prev,
        resolution: [...prev.resolution, null],
      }));
    }
  };
  return (
    <div className="flex flex-row w-full justify-between px-2.5 items-center gap-x-4 text-muted-foreground">
      <Input
        placeholder="Search prop text..."
        value={propText}
        onChange={(e) => setPropText(e.target.value)}
      />
      <div className="flex flex-row items-center gap-x-2 px-1 shrink-0">
        <p className="text-sm shrink-0">Hide unresolved</p>
        <Checkbox
          checked={!filter.resolution.includes(null)}
          onCheckedChange={handleCheck}
        />
      </div>
    </div>
  );
}
