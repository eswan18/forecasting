import { Container } from "@/components/ui/container";
import {
  BarChartHorizontal,
  Flag,
  Medal,
  MessageCircle,
  Users,
} from "lucide-react";
import { AdminNavCard, type AdminNavCardProps } from "./admin-nav-card";

const ADMIN_SECTIONS: AdminNavCardProps[] = [
  {
    href: "/admin/users",
    title: "Users",
    description: "Browse accounts, manage access, and impersonate users.",
    icon: <Users size={18} />,
  },
  {
    href: "/admin/competitions",
    title: "Competitions",
    description: "Create competitions and review their props and resolutions.",
    icon: <Medal size={18} />,
  },
  {
    href: "/admin/feature-flags",
    title: "Feature Flags",
    description: "Toggle features globally or for individual users.",
    icon: <Flag size={18} />,
  },
  {
    href: "/admin/suggested-props",
    title: "Suggested Props",
    description: "Review propositions submitted by forecasters.",
    icon: <MessageCircle size={18} />,
  },
  {
    href: "/admin/forecast-progress/6",
    title: "Forecast Progress",
    description: "See how far along each forecaster is in a competition.",
    icon: <BarChartHorizontal size={18} />,
  },
];

export default function AdminIndexPage() {
  return (
    <main className="py-10 lg:py-14">
      <Container>
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Admin
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage users, competitions, and platform configuration.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_SECTIONS.map((section) => (
            <AdminNavCard key={section.href} {...section} />
          ))}
        </div>
      </Container>
    </main>
  );
}
