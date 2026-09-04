"use client";

import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Bucket = "awaiting" | "resolved";

const LABEL: Record<Bucket, string> = {
  awaiting: "Awaiting result",
  resolved: "Resolved",
};

/**
 * The section head of a settled-prop list, which is also the way to the other
 * one.
 *
 * `awaiting` and `resolved` are two halves of the same thing — props past their
 * deadline — so crossing between them is a change of view rather than a journey
 * somewhere else, and it belongs on the heading that names the view. Only these
 * two are offered: `open` is not a third bucket but a different phase, and a
 * competition with a shared deadline never has open props at the same time as
 * settled ones.
 *
 * Each option carries its size, so an empty destination is visible before it is
 * chosen rather than after.
 */
export function BucketPicker({
  competitionId,
  current,
  counts,
}: {
  competitionId: number;
  current: Bucket;
  counts: Record<Bucket, number>;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="bucket">
          {LABEL[current]}
          <span className="car" aria-hidden="true">
            ▾
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="riso-pick-list">
        {(["awaiting", "resolved"] as Bucket[]).map((bucket) => (
          <DropdownMenuItem
            key={bucket}
            // The live one stays in the list rather than being hidden, so the
            // menu always shows both halves and which one you are on.
            aria-current={bucket === current ? "true" : undefined}
            onSelect={() => {
              if (bucket === current) return;
              router.push(`/competitions/${competitionId}/props/${bucket}`);
            }}
          >
            {LABEL[bucket]}
            <span className="n">{counts[bucket]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
