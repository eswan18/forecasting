"use client";

import Link from "next/link";
import {
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { NavLink, NavLinkGroup } from "./nav-types";

interface DropdownNavbarItemProps {
  group: NavLinkGroup;
}

function LinkItem({ href, label, icon }: NavLink) {
  return (
    <li key={href}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="riso-menu-item block select-none space-y-1 p-3 leading-none no-underline outline-none transition-colors"
        >
          <div className="flex items-center space-x-2">
            {icon}
            <div className="text-sm font-medium leading-snug">{label}</div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function DropdownNavbarItem({
  group: { label, links, sections },
}: DropdownNavbarItemProps) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="riso-kicker h-9 px-3 py-1">
        {label}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="riso-menu">
        {sections ? (
          <div className="flex w-max max-w-[600px] gap-4 p-4">
            {sections.map((section) => (
              <div key={section.heading} className="flex-1">
                <h4 className="riso-menu-heading mb-2 px-3">
                  {section.heading}
                </h4>
                <ul className="grid gap-1">
                  {section.links.map((link) => (
                    <LinkItem key={link.href} {...link} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
            {links?.map((link) => (
              <LinkItem key={link.href} {...link} />
            ))}
          </ul>
        )}
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
