import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import ThemeToggle from "./theme-toggle";
import { UserStatus } from "./user-status";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getUserFromCookies } from "@/lib/get-user";

export default async function NavBar() {
  const user = await getUserFromCookies();
  const userId = user?.id;
  const links = [
    { href: `/forecasts/2024/user/${userId}`, label: "My Forecasts" },
    { href: "/scores/2024", label: "Scores" },
  ];
  const adminLinks = [
    { href: "/users", label: "Users" },
    { href: "/props/2024", label: "Props" },
    { href: "/props/suggested", label: "Suggested Props" },
  ];
  return (
    <div className="w-full flex justify-between px-2 mt-3">
      <div className="flex flex-row justify-start">
        <Link href="/">
          <Button
            variant="ghost"
            className={`font-bold md:mr-6 ${user && "hidden md:inline"}`}
          >
            Forecasting
          </Button>
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            {user?.is_admin && (
              <NavigationMenuItem>
                <NavigationMenuTrigger>Admin Tools</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="p-2">
                    {adminLinks.map(({ href, label }) => (
                      <li key={href}>
                        <Link href={href} passHref legacyBehavior>
                          <NavigationMenuLink
                            className={`${navigationMenuTriggerStyle()} px-2`}
                          >
                            {label}
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}
            {user &&
              links.map(({ href, label }) => (
                <NavigationMenuItem key={href}>
                  <Link href={href} passHref legacyBehavior>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      {label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div className="flex flex-row justify-end gap-3">
        <UserStatus />
        <ThemeToggle />
      </div>
    </div>
  );
}
