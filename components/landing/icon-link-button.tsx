import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

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
    <Button asChild variant="outline" size="sm" className="min-w-[75%]">
      <Link href={href} className="flex items-center justify-between w-full">
        <Icon className="h-3 w-3 shrink-0" />
        <span>{children}</span>
      </Link>
    </Button>
  );
}
