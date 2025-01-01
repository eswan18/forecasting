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
import { VUser } from "@/types/db_types";

type Link = {
  href: string;
  label: string;
};

type LinkGroup = {
  label: string;
  links: Link[];
};

export default async function NavBar() {
  const user = await getUserFromCookies();
  const userId = user?.id;
  const links: (Link | LinkGroup)[] = [{
    label: "Forecasts",
    links: [
      { href: `/forecasts/2024`, label: "2024 Forecast Overview" },
      { href: `/forecasts/2025`, label: "2025 Forecast Overview" },
    ],
  }, {
    label: "Scores",
    links: [{
      href: "/scores/2024",
      label: "2024 Scores",
    }],
  }];
  if (userId) {
    const forecastLinks = links.find(({ label }) =>
      label === "Forecasts"
    ) as LinkGroup;
    forecastLinks.links.unshift({
      href: `/forecasts/2025/user/${userId}`,
      label: "Your Forecasts",
    });
  }
  const adminLinks: Link[] = [
    { href: "/admin/users", label: "Users" },
    { href: "/admin/feature-flags", label: "Feature Flags" },
    { href: "/props/2024", label: "Props" },
    { href: "/admin/suggested-props", label: "Suggested Props" },
    { href: "/admin/forecast-progress/2025", label: "2025 Forecast Progress" },
  ];
  if (user?.is_admin) {
    links.unshift({ label: "Admin", links: adminLinks });
  }
  function isLink(link: Link | LinkGroup): link is Link {
    return (link as Link).href !== undefined;
  }

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
            {user && links.map((link) =>
              isLink(link)
                ? (
                  <NavigationMenuItem key={link.href}>
                    <Link href={link.href} passHref legacyBehavior>
                      <NavigationMenuLink
                        className={navigationMenuTriggerStyle()}
                      >
                        {link.label}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )
                : (
                  <DropdownNavbarItem
                    key={link.label}
                    group={link}
                    user={user}
                  />
                )
            )}
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

async function DropdownNavbarItem(
  { group: { label, links }, user }: { group: LinkGroup; user?: VUser },
) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>{label}</NavigationMenuTrigger>
      <NavigationMenuContent className={user?.is_admin ? "w-80" : "w-64"}>
        <ul className="p-2 bg-background">
          {links.map(({ href, label }) => (
            <li key={href} className="flex flex-col items-center">
              <Link href={href} passHref legacyBehavior>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  {label}
                </NavigationMenuLink>
              </Link>
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
