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
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="flex items-center space-x-2">
            {icon}
            <div className="text-sm font-medium leading-none">{label}</div>
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
      <NavigationMenuTrigger className="h-9 px-3 py-1">
        {label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        {sections ? (
          <div className="flex w-[400px] gap-4 p-4 md:w-[500px] lg:w-[600px]">
            {sections.map((section) => (
              <div key={section.heading} className="flex-1">
                <h4 className="mb-2 px-3 text-sm font-semibold text-muted-foreground">
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
