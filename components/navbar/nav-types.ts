import { ReactElement } from "react";

export type NavLink = {
  href: string;
  label: string;
  icon?: ReactElement;
};

export type NavLinkSection = {
  heading: string;
  links: NavLink[];
};

export type NavLinkGroup = {
  label: string;
  links?: NavLink[];
  sections?: NavLinkSection[];
};
