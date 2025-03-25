"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VProp } from "@/types/db_types";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateEditPropForm } from "@/components/forms/create-edit-prop-form";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Row from "./row";
import { Checkbox } from "@/components/ui/checkbox";

interface PropTableSearchParams {
  propText: string | null;
  resolution: (boolean | null)[];
}

interface PropTableProps {
  data: VProp[];
  editable: boolean;
}

export function PropTable({ data, editable }: PropTableProps) {
  const router = useRouter();
  const pathName = usePathname();
  const rawSearchParams = useSearchParams();
  const searchParams: PropTableSearchParams = {
    propText: rawSearchParams.get("prop_text") || null,
    resolution: rawSearchParams.getAll("resolution").map((value) => {
      if (value === "true") return true;
      else if (value === "false") return false;
      else if (value === "null") return null;
      else return undefined;
    }).filter((value) => value !== undefined),
  };
  if (searchParams.resolution.length === 0) {
    // If no resolution filters are set, that means we use the default: show only
    // resolved props, which are [true, false],
    searchParams.resolution = [true, false];
  }
  const updateSearchParams = (params: PropTableSearchParams) => {
    const newSearchParams = new URLSearchParams();
    if (params.propText) {
      newSearchParams.set("prop_text", params.propText);
    }
    if (
      !(params.resolution.includes(true) && params.resolution.includes(false) &&
        !params.resolution.includes(null))
    ) {
      // Only add resolution filter if it's not the default
      params.resolution.forEach((value) => {
        const stringValue = value === null ? "null" : String(value);
        newSearchParams.append("resolution", stringValue);
      });
    }
    router.push(`${pathName}?${newSearchParams.toString()}`);
  };
  // Filter the props.
  data = data.filter((row) => {
    const propTextMatch = searchParams.propText
      ? row.prop_text
        .toLowerCase()
        .includes(searchParams.propText.toLowerCase())
      : true;
    const resolutionMatch = searchParams.resolution.includes(row.resolution);
    return propTextMatch && resolutionMatch;
  });
  return (
    <>
      <PropTableFilterPanel
        filter={searchParams}
        setFilter={updateSearchParams}
      />
      {editable && <CreateNewPropButton className="mb-4 w-full" />}
      <ul className="w-full flex flex-col">
        {data.map((row) => (
          <li key={row.prop_id}>
            <Row row={row} editable={editable} />
          </li>
        ))}
      </ul>
    </>
  );
}

function CreateNewPropButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  className = cn("gap-2", className);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className={className}>
          <span>New prop</span>
          <PlusCircle />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new prop</DialogTitle>
        </DialogHeader>
        <CreateEditPropForm onSubmit={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function PropTableFilterPanel(
  { filter, setFilter }: {
    filter: PropTableSearchParams;
    setFilter: (filter: PropTableSearchParams) => void;
  },
) {
  console.log("PropTableFilterPanel", filter);
  const handleCheck = (checked: boolean) => {
    if (checked) {
      // Remove null from the filter.
      setFilter({
        ...filter,
        resolution: filter.resolution.filter((value) => value !== null),
      });
    } else {
      // Add null to the filter
      if (!filter.resolution.includes(null)) {
        setFilter({
          ...filter,
          resolution: [...filter.resolution, null],
        });
      }
    }
  };
  return (
    <div className="w-full flex flex-row justify-center sm:justify-start px-2.5 items-center gap-x-2 text-muted-foreground mb-4 sm:mb-2">
      <p>Hide unresolved props</p>
      <Checkbox
        checked={!filter.resolution.includes(null)}
        onCheckedChange={handleCheck}
      />
    </div>
  );
}
