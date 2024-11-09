import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import ThemeToggle from "./theme-toggle";
import { UserStatus } from "./user-status";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NavBar() {
  return (
    <div className="w-full flex justify-between px-2 mt-3">
      <NavigationMenu>
        <Link href="/">
          <Button
            variant="ghost"
            size="lg"
            className="hidden lg:inline font-bold"
          >
            Forecasting
          </Button>
        </Link>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="/scores/2024"
              className={navigationMenuTriggerStyle()}
            >
              Scores
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              href="/props/2024"
              className={navigationMenuTriggerStyle()}
            >
              Props
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex flex-row justify-end gap-3">
        <UserStatus />
        <ThemeToggle />
      </div>
    </div>
  );
}
