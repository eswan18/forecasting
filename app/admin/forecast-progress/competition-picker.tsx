"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Which season's progress is on screen; see the note in `page.tsx`. */
export const COMPETITION_PARAM = "competition";

/**
 * Which season the board reports on.
 *
 * The choice is in the query string rather than the path, so the page has one
 * address and a particular season is still a link. `push`, not `replace`: this
 * fetches a different board — a page's worth of new content — so it earns a
 * history entry, unlike the filter bars elsewhere.
 */
export function CompetitionPicker({
  competitions,
  selectedId,
}: {
  competitions: { id: number; name: string }[];
  selectedId: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Select
      value={String(selectedId)}
      onValueChange={(next) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(COMPETITION_PARAM, next);
        router.push(`${pathname}?${params.toString()}`);
      }}
    >
      <SelectTrigger className="riso-pick" aria-label="Competition">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="riso-pick-list">
        {competitions.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
