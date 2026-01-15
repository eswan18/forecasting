"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { NavLinkGroup } from "./nav-types";

interface MobileDropdownItemProps {
  group: NavLinkGroup;
  isExpanded: boolean;
  onToggle: () => void;
}

export function MobileDropdownItem({
  group: { label, links },
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
          {links.map(({ href, label, icon }) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
