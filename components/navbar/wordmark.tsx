import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
}

/**
 * The Haruspex mark: the name set in the same mono as every other label on the
 * sheet, but at full ink so it outranks the nav links beside it. No glyph — on a
 * printed page the masthead is the name, and the instrument belongs in the
 * content rather than the chrome.
 *
 * Pure presentational leaf: no router or db coupling, so the navbar supplies
 * the surrounding <Link> and this is trivial to render in Storybook.
 */
export function Wordmark({ className }: WordmarkProps) {
  return (
    <span
      className={cn(
        "riso-wordmark select-none font-[family-name:var(--font-roboto-mono)] text-sm uppercase tracking-[0.18em]",
        className,
      )}
    >
      Haruspex
    </span>
  );
}
