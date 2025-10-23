import React from "react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LucideIcon } from "lucide-react";

export default function PageHeading({
  title,
  className,
  children,
  breadcrumbs,
  icon,
  iconGradient,
}: {
  title: string;
  className?: string;
  children?: React.ReactNode;
  breadcrumbs?: Record<string, string>;
  icon?: LucideIcon;
  iconGradient?: string;
}) {
  const defaultClassName = "w-full mb-8 flex flex-col items-center gap-y-4";
  className = cn(defaultClassName, className);
  return (
    <header className={className}>
      {breadcrumbs && Object.keys(breadcrumbs).length > 0 && (
        <div className="flex flex-row items-start w-full">
          <Breadcrumb>
            <BreadcrumbList>
              {Object.entries(breadcrumbs).map(
                ([label, href], index, array) => (
                  <div key={label} className="flex items-center">
                    <BreadcrumbItem>
                      {index === array.length - 1 ? (
                        <BreadcrumbPage>{label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < array.length - 1 && <BreadcrumbSeparator />}
                  </div>
                ),
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
        {icon && (
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              iconGradient || "bg-gradient-to-br from-blue-500 to-purple-600"
            }`}
          >
            {React.createElement(icon, { className: "h-5 w-5 text-white" })}
          </div>
        )}
        <div className="min-w-0 flex items-center gap-2">
          <h1 className="text-2xl font-bold inline">{title}</h1>
          {children}
        </div>
      </div>
    </header>
  );
}
