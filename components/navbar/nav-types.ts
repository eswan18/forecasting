import { ReactElement } from "react";

export type NavLink = {
  href: string;
  label: string;
  icon?: ReactElement;
};

export type NavLinkGroup = {
  label: string;
  links: NavLink[];
};
