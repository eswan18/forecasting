"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Competition } from "@/types/db_types";
import { useRouter } from "next/navigation";

export default function CompetitionSelector(
  { competitions, selectedCompetitionId, redirectOnSelect }: {
    competitions: Competition[];
    selectedCompetitionId: number;
    redirectOnSelect?: (id: number) => Promise<string>;
  },
) {
  const router = useRouter();
  return (
    <div className="flex flex-row gap-2 mt-2">
      <Select
        value={String(selectedCompetitionId.toString())}
        onValueChange={async (competitionId) => {
          if (!redirectOnSelect) return;
          const link = await redirectOnSelect(parseInt(competitionId, 10));
          router.push(link);
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select a year" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Years</SelectLabel>
            {competitions.map((competition) => (
              <SelectItem
                key={competition.id}
                value={competition.id.toString()}
              >
                {competition.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
