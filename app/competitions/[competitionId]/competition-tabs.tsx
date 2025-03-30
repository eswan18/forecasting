"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";

export default function CompetitionTabs({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathParts = pathname.split("/");
  const competitionId = pathParts[pathParts.length - 2];
  const subpage = pathParts[pathParts.length - 1];

  return (
    <Tabs
      defaultValue={subpage}
      className={className}
      onValueChange={(newTab) => {
        router.push(`/competitions/${competitionId}/${newTab}`);
      }}
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="props">Props</TabsTrigger>
        <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
        <TabsTrigger value="scores">Scores</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
