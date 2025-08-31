"use client";

import { VProp } from "@/types/db_types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Row from "./row";
import CreateNewPropButton from "./create-new-prop-button";
import PropTableFilterPanel from "./prop-table-filter-panel";

export interface PropTableSearchParams {
  propText: string | null;
  resolution: (boolean | null)[];
}

interface PropTableProps {
  data: VProp[];
  editable: boolean;
  competitionId?: number | undefined;
  defaultPropUserId?: number | undefined;
}

export function PropTable({
  data,
  editable,
  competitionId,
  defaultPropUserId,
}: PropTableProps) {
  const router = useRouter();
  const pathName = usePathname();
  const rawSearchParams = useSearchParams();
  const rawResolution = rawSearchParams
    .getAll("resolution")
    .map((value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      if (value === "null") return null;
      return undefined;
    })
    .filter((value) => value !== undefined) as (boolean | null)[];
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
      !(
        params.resolution.includes(true) &&
        params.resolution.includes(false) &&
        !params.resolution.includes(null)
      )
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
      <div className="flex flex-row items-center justify-between gap-x-8 mb-4">
        <PropTableFilterPanel
          filter={searchParams}
          setFilter={updateSearchParams}
        />
        {editable && (
          <CreateNewPropButton
            defaultUserId={defaultPropUserId}
            defaultCompetitionId={competitionId}
          />
        )}
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
