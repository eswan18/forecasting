"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SHOW_PARAM } from "./visible-seasons";

const CHOICES: { id: string; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "all", label: "All" },
];

/**
 * Whether the dashboard lists every season or only the ones still in play.
 *
 * A finished season keeps its place on the dashboard — its result is as much a
 * result as a live one — but they accumulate, and after a few years the seasons
 * you can still do something about are below the fold. This is the way back to
 * just those, and it is in the query string like every other filter here, so
 * the view is a link.
 */
export function SeasonFilter({ showAll }: { showAll: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <span className="riso-seg">
      {CHOICES.map((c) => (
        <button
          key={c.id}
          type="button"
          aria-pressed={showAll === (c.id === "all")}
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            if (c.id === "all") {
              params.set(SHOW_PARAM, "all");
            } else {
              params.delete(SHOW_PARAM);
            }
            const query = params.toString();
            router.replace(query ? `${pathname}?${query}` : pathname, {
              scroll: false,
            });
          }}
        >
          {c.label}
        </button>
      ))}
    </span>
  );
}
