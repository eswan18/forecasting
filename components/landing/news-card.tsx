import { LucideIcon } from "lucide-react";

interface NewsCardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  buttons?: React.ReactNode;
}

export default function NewsCard({
  icon: Icon,
  title,
  children,
  buttons,
}: NewsCardProps) {
  return (
    <div className="rounded-lg border bg-card p-5 transition-colors hover:border-foreground/20">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h3>
      </div>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
      {buttons && <div className="mt-4 flex flex-col gap-2">{buttons}</div>}
    </div>
  );
}
