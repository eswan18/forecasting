import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MarkdownRenderer } from "@/components/markdown";

export default function PageHeading({
  title,
  className,
  children,
  breadcrumbs,
}: {
  title: string;
  className?: string;
  children?: React.ReactNode;
  breadcrumbs?: Record<string, string>;
}) {
  const defaultClassName = "w-full mb-8 flex flex-col items-center gap-y-1";
  className = cn(defaultClassName, className);
  const hasBreadcrumbs = breadcrumbs && Object.keys(breadcrumbs).length > 0;
  return (
    <header className={className}>
      {/* Always reserve space for breadcrumbs to maintain consistent layout */}
      <div className="flex flex-row items-start w-full min-h-[20px]">
        {hasBreadcrumbs && (
          <Breadcrumb>
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
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
        <div className="min-w-0 flex items-center gap-x-4">
          <h1 className="text-2xl font-bold inline">
            <MarkdownRenderer>{title}</MarkdownRenderer>
          </h1>
          {children}
        </div>
      </div>
    </header>
  );
}
