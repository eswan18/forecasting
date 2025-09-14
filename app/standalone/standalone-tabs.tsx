"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StandaloneTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const pathParts = pathname.split("/");
  const subpage = pathParts[2];

  return (
    <Tabs
      // We intentionally prevent the active tab from changing: tabs are links, so the
      // page will reload when another tab is clicked.
      value={subpage}
      className={className}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="props">
          <Link href="/standalone/props" className="w-full">
            Props
          </Link>
        </TabsTrigger>
        <TabsTrigger value="calibration">
          <Link href="/standalone/calibration" className="w-full">
            Calibration
          </Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
