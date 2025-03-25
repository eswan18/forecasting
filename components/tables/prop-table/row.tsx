import { VProp } from "@/types/db_types";
import { Check, X } from "lucide-react";
import ResolutionSelectWidget from "./resolution-select-widget";
import { resolveProp, unresolveProp } from "@/lib/db_actions";
import { EditPropButton } from "./edit-prop-button";

export default function Row(
  { row, editable }: { row: VProp; editable: boolean },
) {
  const resolution = row.resolution !== null
    ? (
      row.resolution
        ? <Check size={20} strokeWidth={3} className="text-green-500" />
        : <X size={20} strokeWidth={3} className="text-destructive" />
    )
    : <p className="text-muted-foreground">?</p>;
  return (
    <div className="w-full bg-card grid grid-cols-[4fr_1fr] px-4 py-4 border gap-x-1">
      <div className="flex flex-col gap-y-1">
        <p>{row.prop_text}{editable && <EditPropButton prop={row} />}</p>
        <p className="text-muted-foreground text-sm">{row.category_name}</p>
      </div>
      <div className="flex flex-row items-center justify-end text-lg font-bold gap-x-2 px-2">
        {editable
          ? (
            <ResolutionSelectWidget
              resolution={row.resolution ?? undefined}
              setResolution={(resolution, notes) =>
                resolution === undefined
                  ? unresolveProp({ propId: row.prop_id })
                  : resolveProp({
                    propId: row.prop_id,
                    resolution,
                    overwrite: true,
                    notes,
                  })}
            />
          )
          : resolution}
      </div>
    </div>
  );
}
