import { Button } from "@/components/ui/button";
import { VProp } from "@/types/db_types";
import { Check, MoreHorizontal, X } from "lucide-react";
import { ActionDropdown } from "./action-dropdown";

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
        <p>{row.prop_text}</p>
        <p className="text-muted-foreground text-sm">{row.category_name}</p>
      </div>
      <div className="flex flex-row items-center justify-end text-lg font-bold gap-x-2 px-2">
          {resolution}
          {editable && <ActionDropdown prop={row} />}
      </div>
    </div>
  );
}
