"use client";
import { cn } from "@/lib/utils";
import { VProp } from "@/types/db_types";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table } from "@tanstack/react-table";

export function Filters(
  { table, className }: { table: Table<VProp>; className?: string },
) {
  const classes = cn(
    "grid grid-cols-2 grid-rows-[auto_auto] grid-flow-col gap-x-4 gap-y-2",
    className,
  );
  return (
    <div className={classes}>
      <Label>Text</Label>
      <Input
        placeholder="Search prop text..."
        value={(table.getColumn("prop_text")
          ?.getFilterValue() as string) ??
          ""}
        onChange={(event) =>
          table.getColumn("prop_text")?.setFilterValue(
            event.target.value,
          )}
        className="max-w-sm"
      />
      <Label>Resolution</Label>
      <ResolutionFilter
        filterValue={table.getColumn("resolution")?.getFilterValue() as
          | ResolutionOption[]
          | undefined}
        setFilterValue={(value) =>
          table.getColumn("resolution")?.setFilterValue(value)}
      />
    </div>
  );
}

type ResolutionOption = "Yes" | "No" | "?";

function ResolutionFilter(
  { filterValue, setFilterValue }: {
    filterValue: ResolutionOption[] | undefined;
    setFilterValue: (value: ResolutionOption[]) => void;
  },
) {
  const resolutions: ResolutionOption[] = ["Yes", "No", "?"];
  const addResolutionToFilter = (resolution: ResolutionOption) => {
    const prev = filterValue ?? [];
    setFilterValue(
      prev.includes(resolution)
        ? prev.filter((v) => v !== resolution)
        : [...prev, resolution],
    );
  };
  const removeResolutionFromFilter = (resolution: ResolutionOption) => {
    const prev = filterValue ?? [];
    setFilterValue(prev.filter((v) => v !== resolution));
  };
  return (
    <div className="flex flex-row w-full text-sm gap-6">
      {resolutions.map((resolution) => (
        <div
          key={resolution}
          className="flex flex-row justify-start items-center gap-1.5"
        >
          <Checkbox
            id={resolution}
            checked={filterValue?.includes(resolution) ?? false}
            onCheckedChange={(checked) =>
              checked
                ? addResolutionToFilter(resolution)
                : removeResolutionFromFilter(resolution)}
          />
          <Label htmlFor={resolution} className="text-muted-foreground">
            {resolution}
          </Label>
        </div>
      ))}
    </div>
  );
}
