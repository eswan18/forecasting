import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";

interface IconLinkButtonProps {
  icon: LucideIcon;
  href: string;
  children: React.ReactNode;
}

export default function IconLinkButton({
  icon: Icon,
  href,
  children,
}: IconLinkButtonProps) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{children}</span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
