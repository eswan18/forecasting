"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname } from "next/navigation";

export default function CompetitionTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const pathParts = pathname.split("/");
  const subpage = pathParts[pathParts.length - 1];

  return (
    <Tabs defaultValue={subpage} className={className}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="props">Props</TabsTrigger>
        <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
        <TabsTrigger value="scores">Scores</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
