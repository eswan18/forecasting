"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { NavLink, NavLinkGroup } from "./nav-types";

interface MobileDropdownItemProps {
  group: NavLinkGroup;
  isExpanded: boolean;
  onToggle: () => void;
}

function MobileLinkItem({ href, label, icon }: NavLink) {
  return (
    <SheetClose asChild key={href}>
      <Link href={href}>
        <Button
          variant="ghost"
          className="w-full justify-start h-10 text-sm pl-6"
        >
          <span className="mr-3">{icon}</span>
          {label}
        </Button>
      </Link>
    </SheetClose>
  );
}

export function MobileDropdownItem({
  group: { label, links, sections },
  isExpanded,
  onToggle,
}: MobileDropdownItemProps) {
  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        className="w-full justify-between h-12 text-base"
        onClick={onToggle}
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </Button>
      {isExpanded && (
        <div className="space-y-1 pl-4">
          {sections
            ? sections.map((section) => (
                <div key={section.heading} className="space-y-1">
                  <div className="px-6 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.heading}
                  </div>
                  {section.links.map((link) => (
                    <MobileLinkItem key={link.href} {...link} />
                  ))}
                </div>
              ))
            : links?.map((link) => (
                <MobileLinkItem key={link.href} {...link} />
              ))}
        </div>
      )}
    </div>
  );
}
