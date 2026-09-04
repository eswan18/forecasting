"use client";

import { useRouter } from "next/navigation";

import { OpenProps } from "@/components/open-props/open-props";
import type { PropWithUserForecast } from "@/types/db_types";

/**
 * The client boundary the open list needs for its refresh: each row seeds its
 * entry state from the prop it was rendered with, so a save has to re-fetch or
 * the row keeps showing the pre-save value as "changed".
 */
export function OpenPropsPage({
  props,
  competitionId,
  competitionName,
  currentUserId,
  isAdmin,
  canWriteProps,
}: {
  props: PropWithUserForecast[];
  competitionId: number;
  competitionName: string;
  currentUserId: number;
  isAdmin: boolean;
  /** Whether the new-prop route would let this reader in; see its own guard. */
  canWriteProps: boolean;
}) {
  const router = useRouter();
  return (
    <OpenProps
      props={props}
      title={competitionName}
      backHref={`/competitions/${competitionId}`}
      newHref={
        canWriteProps ? `/competitions/${competitionId}/props/new` : undefined
      }
      currentUserId={currentUserId}
      isAdmin={isAdmin}
      onSaved={() => router.refresh()}
    />
  );
}
