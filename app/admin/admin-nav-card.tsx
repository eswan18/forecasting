import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn, focusRing } from "@/lib/utils";

export interface AdminNavCardProps {
  href: string;
  title: string;
  description: string;
  /** A small icon (e.g. a lucide glyph) shown in the card's corner badge. */
  icon: React.ReactNode;
}

/**
 * Flat, bordered link card for the admin landing index. Depth comes from a
 * hairline border; hover shifts the border color (no drop shadow), matching
 * the soft-minimal surface language.
 */
export function AdminNavCard({
  href,
  title,
  description,
  icon,
}: AdminNavCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-4 rounded-lg border bg-card p-5 transition-colors hover:border-foreground/20",
        focusRing,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground transition-colors group-hover:text-foreground">
          {icon}
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
      </div>
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </Link>
  );
}
