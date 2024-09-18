import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

import ThemeToggle from './theme-toggle';
import { UserStatus } from './user-status';
import Link from "next/link";
import { Button } from "../ui/button";

export default async function NavBar() {
  return (
    <div className="w-full flex justify-between my-1">
      <NavigationMenu>
        <Link href="/"><Button variant='ghost' className="hidden text-primary underline lg:inline">Forecasting</Button></Link>
        <NavigationMenuList>

          <NavigationMenuItem>
            <Link href="/scores/2024">
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>Scores</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <Link href="/props/2024">
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>Props</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>

        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex flex-row justify-end gap-3">
        <UserStatus />
        <ThemeToggle />
      </div>
    </div>
  )
}