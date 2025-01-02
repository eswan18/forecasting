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
import { ReactElement } from "react";
import {
  BarChart,
  BarChartHorizontal,
  Edit,
  Flag,
  Medal,
  MessageCircle,
  TrendingUpDown,
  Users,
} from "lucide-react";

type NavLink = {
  href: string;
  label: string;
  icon?: ReactElement;
};

type NavLinkGroup = {
  label: string;
  links: NavLink[];
};

export default async function NavBar() {
  const user = await getUserFromCookies();
  const userId = user?.id;
  const links: (NavLink | NavLinkGroup)[] = [{
    label: "Forecasts",
    links: [
      {
        href: `/forecasts/2025`,
        label: "2025 Forecast Stats",
        icon: <BarChart size={16} />,
      },
    ],
  }, {
    label: "Scores",
    links: [{
      href: "/scores/2024",
      label: "2024 Scores",
      icon: <Medal size={16} />,
    }],
  }];
  if (userId) {
    const forecastLinks = links.find(({ label }) =>
      label === "Forecasts"
    ) as NavLinkGroup;
    forecastLinks.links.unshift({
      href: `/forecasts/2025/user/${userId}`,
      label: "Your 2025 Forecasts",
      icon: <TrendingUpDown size={14} />,
    });
  }
  const adminLinks: NavLink[] = [
    { href: "/admin/users", label: "Users", icon: <Users size={16} /> },
    {
      href: "/admin/feature-flags",
      label: "Feature Flags",
      icon: <Flag size={16} />,
    },
    { href: "/props/2025", label: "Add/Edit Props", icon: <Edit size={16} /> },
    {
      href: "/admin/suggested-props",
      label: "View Suggested Props",
      icon: <MessageCircle size={16} />,
    },
    {
      href: "/admin/forecast-progress/2025",
      label: "2025 Forecast Progress",
      icon: <BarChartHorizontal size={16} />,
    },
  ];
  if (user?.is_admin) {
    links.unshift({ label: "Admin", links: adminLinks });
  }
  function isLink(link: NavLink | NavLinkGroup): link is NavLink {
    return (link as NavLink).href !== undefined;
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
  { group: { label, links }, user }: { group: NavLinkGroup; user?: VUser },
) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>{label}</NavigationMenuTrigger>
      <NavigationMenuContent className={user?.is_admin ? "w-80" : "w-64"}>
        <ul className="p-2 bg-background">
          {links.map(({ href, label, icon }) => (
            <li key={href} className="flex flex-col items-center">
              <Link href={href} passHref legacyBehavior>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  {icon && <span className="mr-2">{icon}</span>}
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
