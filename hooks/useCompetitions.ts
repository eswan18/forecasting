"use client";

import useSWRImmutable from "swr/immutable";
import type { Competition } from "@/types/db_types";
import { fetchJson, HttpError } from "@/lib/http";

type CompetitionsResponse = {
  competitions: Competition[];
};

export function useCompetitions() {
  return useSWRImmutable<Competition[], HttpError>(
    "/api/competitions",
    async (url) => {
      const data = await fetchJson<CompetitionsResponse>(url);
      return data.competitions;
    },
    {
      shouldRetryOnError: false,
    },
  );
}
