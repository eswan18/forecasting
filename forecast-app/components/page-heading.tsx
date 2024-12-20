export default function PageHeading({ title, className, children }: { title: string, className?: string, children?: React.ReactNode }) {
  return (
    <header className={`mb-4 ${className}`}>
      <h1 className="text-2xl font-bold inline">{title}</h1>
      {children}
    </header>
  );
}