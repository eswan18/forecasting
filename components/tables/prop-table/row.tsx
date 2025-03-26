import { VProp } from "@/types/db_types";
import { Check, MessageCircleMore, X } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import ResolutionSelectWidget from "./resolution-select-widget";
import { resolveProp, unresolveProp } from "@/lib/db_actions";
import { EditPropButton } from "./edit-prop-button";
import { Label } from "@/components/ui/label";

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
    <div className="w-full bg-card grid grid-cols-[7fr_2fr] px-4 py-4 border gap-x-1 items-start justify-end min-h-24">
      <div className="flex flex-col gap-y-1">
        <p>{row.prop_text}{editable && <EditPropButton prop={row} />}</p>
        <p className="text-muted-foreground text-sm">{row.category_name}</p>
      </div>
      <div className="flex flex-col items-end justify-start text-lg">
        <div className="flex flex-col justify-start items-center gap-y-2 min-w-12">
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
          {row.resolution_notes && (
            <HoverCard>
              <HoverCardTrigger>
                <span className="text-muted-foreground text-xs flex flex-row items-center gap-x-1">
                  Notes<MessageCircleMore size={16} />
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="min-w-48 max-w-72">
                <Label className="text-sm text-muted-foreground">Resolution Notes</Label>
                <p className="text-sm">{row.resolution_notes}</p>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      </div>
    </div>
  );
}
