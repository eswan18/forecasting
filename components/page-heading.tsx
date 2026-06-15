import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MarkdownRenderer } from "@/components/markdown";

/**
 * Left-aligned page heading: optional breadcrumbs, a title (markdown-aware),
 * an optional muted subtitle, and an optional right-aligned action slot
 * (`children`). The soft-minimal type treatment — semibold, tight-tracked —
 * matches the section headers used across the app.
 */
export default function PageHeading({
  title,
  subtitle,
  className,
  children,
  breadcrumbs,
}: {
  title: string;
  /** Optional muted line rendered under the title. */
  subtitle?: string;
  className?: string;
  /** Optional trailing action (e.g. a button); right-aligned on sm+. */
  children?: React.ReactNode;
  breadcrumbs?: Record<string, string>;
}) {
  const hasBreadcrumbs = breadcrumbs && Object.keys(breadcrumbs).length > 0;
  return (
    <header className={cn("mb-8 w-full", className)}>
      {hasBreadcrumbs && (
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            {Object.entries(breadcrumbs).map(([label, href]) => (
              <div key={label} className="flex items-center">
                <BreadcrumbItem>
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-foreground">
          <MarkdownRenderer>{title}</MarkdownRenderer>
        </h1>
        {children && <div className="shrink-0">{children}</div>}
      </div>
      {subtitle && (
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </header>
  );
}
