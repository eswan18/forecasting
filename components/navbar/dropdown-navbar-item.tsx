"use client";

import Link from "next/link";
import {
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { NavLinkGroup } from "./nav-types";

interface DropdownNavbarItemProps {
  group: NavLinkGroup;
}

export function DropdownNavbarItem({
  group: { label, links },
}: DropdownNavbarItemProps) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="h-9 px-3 py-1">
        {label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
          {links.map(({ href, label, icon }) => (
            <li key={href}>
              <NavigationMenuLink asChild>
                <Link
                  href={href}
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="flex items-center space-x-2">
                    {icon}
                    <div className="text-sm font-medium leading-none">
                      {label}
                    </div>
                  </div>
                </Link>
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
