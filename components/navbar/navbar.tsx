"use client";

import React, { useState, useEffect } from "react";
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
import { ReactElement } from "react";
import {
  BarChartHorizontal,
  Flag,
  Medal,
  MessageCircle,
  User2,
  Users,
  Menu,
  ChevronDown,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { getCompetitions } from "@/lib/db_actions/competitions";
import { Competition } from "@/types/db_types";
import { getCompetitionStatusFromObject } from "@/lib/competition-status";

type NavLink = {
  href: string;
  label: string;
  icon?: ReactElement;
};

type NavLinkGroup = {
  label: string;
  links: NavLink[];
};

export default function NavBar() {
  const { user, isLoading } = useCurrentUser();
  const { enabled: hasPersonalPropsEnabled } = useFeatureFlag("personal-props");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  useEffect(() => {
    if (!isLoading) {
      getCompetitions().then((allCompetitions) => {
        // Filter to visible competitions only (unless user is admin)
        let filteredCompetitions = user?.is_admin
          ? allCompetitions
          : allCompetitions.filter((comp) => comp.visible);

        // Filter out competitions where forecasts haven't opened yet
        filteredCompetitions = filteredCompetitions.filter((comp) => {
          const status = getCompetitionStatusFromObject(comp);
          return status !== "upcoming";
        });

        setCompetitions(filteredCompetitions);
      });
    }
  }, [isLoading, user?.is_admin]);

  const toggleGroup = (groupLabel: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupLabel)) {
      newExpanded.delete(groupLabel);
    } else {
      newExpanded.add(groupLabel);
    }
    setExpandedGroups(newExpanded);
  };

  const links: (NavLink | NavLinkGroup)[] = [];

  // Add competitions section if there are any competitions
  if (competitions.length > 0) {
    links.push({
      label: "Competitions",
      links: competitions.map((competition) => ({
        href: `/competitions/${competition.id}`,
        label: competition.name,
        icon: <Medal size={16} />,
      })),
    });
  }

  // Add standalone section if user has feature enabled
  if (user && !isLoading && hasPersonalPropsEnabled) {
    links.push({
      label: "Standalone",
      links: [
        {
          href: `/standalone`,
          label: "Standalone Props",
          icon: <User2 size={16} />,
        },
      ],
    });
  }

  const adminLinks: NavLink[] = [
    { href: "/admin/users", label: "Users", icon: <Users size={16} /> },
    {
      href: "/admin/competitions",
      label: "Competitions",
      icon: <Medal size={16} />,
    },
    {
      href: "/admin/feature-flags",
      label: "Feature Flags",
      icon: <Flag size={16} />,
    },
    {
      href: "/admin/suggested-props",
      label: "Suggested Props",
      icon: <MessageCircle size={16} />,
    },
    {
      href: "/admin/forecast-progress/2",
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

  if (isLoading) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 w-full">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" className="font-semibold text-lg">
                Forecasting
              </Button>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 w-full">
        {/* Desktop Navigation */}
        <div className="flex items-center justify-start">
          {/* Mobile menu button */}
          {user && (
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SheetClose asChild>
                    <Link href="/">
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 text-lg font-semibold p-0"
                      >
                        Forecasting
                      </Button>
                    </Link>
                  </SheetClose>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {links.map((link) =>
                    isLink(link) ? (
                      <SheetClose asChild key={link.href}>
                        <Link href={link.href}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 text-base"
                          >
                            {link.label}
                          </Button>
                        </Link>
                      </SheetClose>
                    ) : (
                      <MobileDropdownItem
                        key={link.label}
                        group={link}
                        isExpanded={expandedGroups.has(link.label)}
                        onToggle={() => toggleGroup(link.label)}
                      />
                    ),
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}

          <Link href="/">
            <Button variant="ghost" className="font-semibold text-lg ">
              Forecasting
            </Button>
          </Link>

          {user && (
            <div className="hidden md:flex items-center space-x-1 ml-4">
              <NavigationMenu>
                <NavigationMenuList>
                  {links.map((link) =>
                    isLink(link) ? (
                      <NavigationMenuItem key={link.href}>
                        <NavigationMenuLink
                          href={link.href}
                          className={navigationMenuTriggerStyle()}
                        >
                          {link.label}
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    ) : (
                      <DropdownNavbarItem key={link.label} group={link} />
                    ),
                  )}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <UserStatus />
        </div>
      </div>
    </nav>
  );
}

function DropdownNavbarItem({
  group: { label, links },
}: {
  group: NavLinkGroup;
}) {
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

function MobileDropdownItem({
  group: { label, links },
  isExpanded,
  onToggle,
}: {
  group: NavLinkGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
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
