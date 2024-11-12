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
import { getUserFromCookies } from "@/lib/get-user";

export default async function NavBar() {
  const user = await getUserFromCookies();
  const links = [
    { href: "/scores/2024", label: "Scores" },
    { href: "/props/2024", label: "Props" },
  ];
  if (user?.is_admin) {
    links.push({ href: "/users", label: "Users" });
  }
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
          {links.map(({ href, label }) => (
            <NavigationMenuItem key={href}>
              <NavigationMenuLink
                href={href}
                className={navigationMenuTriggerStyle()}
              >
                {label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex flex-row justify-end gap-3">
        <UserStatus />
        <ThemeToggle />
      </div>
    </div>
  );
}
