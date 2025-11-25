"use client";

import { VProp } from "@/types/db_types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PropTableWithFilterBar } from "./prop-table-with-filter-bar";

type PropWithUserForecast = VProp & {
  user_forecast: number | null;
  user_forecast_id: number | null;
};

interface PropsTableProps {
  props: PropWithUserForecast[];
  canCreateProps?: boolean;
  canEditProps?: boolean;
  canEditResolutions?: boolean;
  competitionId?: number | null;
  defaultUserId?: number;
}

export function PropsTable({
  props,
  canCreateProps = false,
  competitionId,
  defaultUserId,
}: PropsTableProps) {
  return (
    <TooltipProvider>
      {/* Prop Table with Filter Bar */}
      <PropTableWithFilterBar
        props={props}
        canCreateProps={canCreateProps}
        competitionId={competitionId}
        defaultUserId={defaultUserId}
      />
    </TooltipProvider>
  );
}
