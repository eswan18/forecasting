"use client";

import { PropWithUserForecast } from "@/types/db_types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PropTableWithFilterBar } from "./prop-table-with-filter-bar";

interface PropsTableProps {
  props: PropWithUserForecast[];
  canCreateProps?: boolean;
  canEditProps?: boolean;
  canEditResolutions?: boolean;
  competitionId?: number | null;
  defaultUserId?: number;
  showCommunityAvg?: boolean;
}

export function PropsTable({
  props,
  canCreateProps = false,
  competitionId,
  defaultUserId,
  showCommunityAvg = false,
}: PropsTableProps) {
  return (
    <TooltipProvider>
      {/* Prop Table with Filter Bar */}
      <PropTableWithFilterBar
        props={props}
        canCreateProps={canCreateProps}
        competitionId={competitionId}
        defaultUserId={defaultUserId}
        showCommunityAvg={showCommunityAvg}
      />
    </TooltipProvider>
  );
}
