"use client";

import { useRouter } from "next/navigation";

import { OpenProps } from "@/components/open-props/open-props";
import type { PropWithUserForecast } from "@/types/db_types";

/**
 * The client boundary the list needs for its refresh: each row seeds its entry
 * state from the prop it was rendered with, so a save has to re-fetch or the
 * row keeps showing the pre-save value as "changed".
 *
 * Every row is editable here — you wrote these props, so resolving them is
 * yours to do.
 */
export function PersonalPropsPage({
  props,
  currentUserId,
}: {
  props: PropWithUserForecast[];
  currentUserId: number;
}) {
  const router = useRouter();
  return (
    <OpenProps
      props={props}
      title="Your props"
      kicker="Personal props"
      // This list holds every prop you ever wrote, so the useful cut is where
      // each one is in its life rather than whether you have forecasted it.
      tabs="stage"
      newHref="/props/new"
      currentUserId={currentUserId}
      isAdmin
      onSaved={() => router.refresh()}
    />
  );
}
