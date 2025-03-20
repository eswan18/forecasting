import { cn } from "@/lib/utils";

export default function PageHeading(
  { title, className, children }: {
    title: string;
    className?: string;
    children?: React.ReactNode;
  },
) {
  const defaultClassName = "mb-8";
  className = cn(defaultClassName, className);
  return (
    <header className={className}>
      <h1 className="text-2xl font-bold inline">{title}</h1>
      {children}
    </header>
  );
}
