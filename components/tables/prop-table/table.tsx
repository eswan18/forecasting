"use client";

import { useEffect, useState } from "react";
import { VProp } from "@/types/db_types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Row from "./row";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CreateNewPropButton } from "./create-new-prop-button";

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
  const rawResolution = rawSearchParams.getAll("resolution").map((value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    if (value === "null") return null;
    return undefined;
  }).filter((value) => value !== undefined) as (boolean | null)[];
  const searchParams: PropTableSearchParams = {
    propText: rawSearchParams.get("prop_text") || null,
    resolution: rawResolution.length > 0 ? rawResolution : [true, false],
  };
  const updateSearchParams = (
    params:
      | PropTableSearchParams
      | ((p: PropTableSearchParams) => PropTableSearchParams),
  ) => {
    const currentParamString = new URLSearchParams(rawSearchParams.toString());
    if (typeof params === "function") {
      params = params(searchParams);
    }
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
    if (currentParamString.toString() !== newSearchParams.toString()) {
      router.push(`${pathName}?${newSearchParams.toString()}`);
    }
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
      <div className="flex flex-row items-end justify-between">
        <PropTableFilterPanel
          filter={searchParams}
          setFilter={updateSearchParams}
        />
        {editable && <CreateNewPropButton className="mb-4" />}
      </div>
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


function PropTableFilterPanel(
  { filter, setFilter }: {
    filter: PropTableSearchParams;
    setFilter: (
      filter:
        | PropTableSearchParams
        | ((p: PropTableSearchParams) => PropTableSearchParams),
    ) => void;
  },
) {
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
    <div className="flex flex-col justify-center px-2.5 items-start gap-2 text-muted-foreground mb-4">
      <div className="flex flex-row items-center gap-x-2 px-1">
        <p>Hide unresolved props</p>
        <Checkbox
          checked={!filter.resolution.includes(null)}
          onCheckedChange={handleCheck}
        />
      </div>
      <Input
        placeholder="Search prop text..."
        value={propText}
        onChange={(e) => setPropText(e.target.value)}
      />
    </div>
  );
}
