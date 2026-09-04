import { Haruspecs } from "@/components/brand/haruspecs";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
}

/**
 * The Haruspex masthead: the mark, then the name in the same mono as every
 * other label on the sheet but at full ink, so it outranks the nav links
 * beside it.
 *
 * The mark is decoration here — the name is right next to it — so it carries
 * no accessible name of its own rather than making a screen reader say
 * "Haruspex Haruspex".
 *
 * Pure presentational leaf: no router or db coupling, so the navbar supplies
 * the surrounding <Link> and this is trivial to render in Storybook.
 */
export function Wordmark({ className }: WordmarkProps) {
  return (
    <span
      className={cn(
        "riso-wordmark inline-flex select-none items-center gap-2 font-[family-name:var(--font-roboto-mono)] text-sm uppercase tracking-[0.18em]",
        className,
      )}
    >
      <Haruspecs width={52} />
      Haruspex
    </span>
  );
}
